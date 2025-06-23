import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Contact from '../models/contact.model';
import { sequelize } from '../config/database';

interface IdentifyRequestBody {
  email?: string;
  phoneNumber?: string;
}

interface ContactResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

interface ContactAttributes {
  id?: number;
  email: string | null;
  phoneNumber: string | null;
  linkedId: number | null;
  linkPrecedence: 'primary' | 'secondary';
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  update: (values: Partial<ContactAttributes>, options?: any) => Promise<ContactAttributes>;
}

export const deleteAll = async (req: Request, res: Response): Promise<Response> => {
  const transaction = await sequelize.transaction();
  
  try {
    await Contact.destroy({
      where: {},
      truncate: true,
      cascade: true,
      transaction
    });
    
    await transaction.commit();
    return res.status(200).json({ message: 'All contacts have been deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting contacts:', error);
    return res.status(500).json({ 
      error: 'Failed to delete contacts',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

export const identify = async (req: Request, res: Response): Promise<Response<ContactResponse>> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { email, phoneNumber } = req.body as IdentifyRequestBody;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Email or phoneNumber is required' });
    }

    const findPrimaryContacts = async (): Promise<ContactAttributes[]> => {
      const whereClause: any = {
        [Op.or]: [
          {
            [Op.and]: [
              { linkPrecedence: 'primary' },
              {
                [Op.or]: [
                  ...(email ? [{ email }] : []),
                  ...(phoneNumber ? [{ phoneNumber }] : [])
                ]
              }
            ]
          },
          {
            id: {
              [Op.in]: sequelize.literal(`(
                SELECT DISTINCT linked_id
                FROM contacts AS secondary
                WHERE secondary.link_precedence = 'secondary'
                AND (
                  ${email ? `secondary.email = ${sequelize.escape(email)}` : 'FALSE'} OR
                  ${phoneNumber ? `secondary.phone_number = ${sequelize.escape(phoneNumber)}` : 'FALSE'}
                )
                AND linked_id IS NOT NULL
              )`)
            }
          }
        ]
      };

      return (await Contact.findAll({
        where: whereClause,
        order: [['createdAt', 'ASC']],
        transaction
      })) as unknown as ContactAttributes[];
    };

    let contact: ContactAttributes | null = null;
    const existingContacts = await findPrimaryContacts();

    if (existingContacts.length === 0) {
      contact = await Contact.create({
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: 'primary',
        linkedId: null
      }, { transaction }) as unknown as ContactAttributes;
    } else if (existingContacts.length === 1) {
      const primaryContact = existingContacts[0];
      // if (email && phoneNumber && 
      //     primaryContact.email === email && 
      //     primaryContact.phoneNumber === phoneNumber) {
      //   contact = primaryContact;
      // } else {
      //   contact = await Contact.create({ 
      //     email: email || null, 
      //     phoneNumber: phoneNumber || null,
      //     linkedId: primaryContact.id, 
      //     linkPrecedence: 'secondary' as const
      //   }, { transaction }) as unknown as ContactAttributes;
      // }

      if(email && phoneNumber) {
        if(primaryContact?.email == email && primaryContact?.phoneNumber == phoneNumber) {
          contact = primaryContact;
        } else {
            contact = await Contact.create({ 
              email: email || null, 
              phoneNumber: phoneNumber || null,
              linkedId: primaryContact.id, 
              linkPrecedence: 'secondary' as const
            }, { transaction }) as unknown as ContactAttributes;
        }
      }
    } else if (existingContacts.length >= 2) {
      const [oldestContact, ...otherContacts] = existingContacts;
      await Promise.all(
        otherContacts.map(contact => 
          (contact as ContactAttributes).update({
            linkedId: oldestContact.id,
            linkPrecedence: 'secondary' as const,
            updatedAt: new Date()
          }, { transaction })
        )
      );
      contact = otherContacts[0];
    }

    const primaryContacts = await findPrimaryContacts();
    const primaryContact = primaryContacts[0];

    if (!primaryContact) {
      await transaction.rollback();
      return res.status(404).json({ error: 'No primary contact found' });
    }

    const relatedContacts = (await Contact.findAll({
      where: {
        [Op.or]: [
          { id: primaryContact.id },
          { linkedId: primaryContact.id }
        ]
      },
      attributes: ['id', 'email', 'phoneNumber', 'linkPrecedence'],
      order: [
        ['linkPrecedence', 'ASC'],
        [sequelize.literal('CASE WHEN link_precedence = "secondary" THEN updated_at END'), 'ASC'],
        [sequelize.literal('CASE WHEN link_precedence = "primary" THEN created_at END'), 'ASC']
      ],
      transaction
    })) as unknown as ContactAttributes[];

    const emails = [...new Set(
      relatedContacts
        .map(c => c.email)
        .filter((email): email is string => email !== null)
    )];

    const phoneNumbers = [...new Set(
      relatedContacts
        .map(c => c.phoneNumber)
        .filter((phone): phone is string => phone !== null)
    )];

    const secondaryContactIds = relatedContacts
      .filter(c => c.linkPrecedence === 'secondary' && c.id !== undefined)
      .map(c => c.id as number);

    await transaction.commit();

    return res.status(200).json({
      contact: {
        primaryContatctId: primaryContact.id as number,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    });
  } catch (error: unknown) {
    await transaction.rollback();
    console.error('Error in identify:', error);
    
    let status = 500;
    let errorMessage = 'Internal server error';
    let details: any = undefined;

    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'SequelizeValidationError') {
        status = 400;
        errorMessage = 'Validation error';
        if ('errors' in error) {
          details = error.errors;
        }
      }
    }

    return res.status(status).json({ 
      error: errorMessage,
      ...(details && { details })
    });
  }
};
