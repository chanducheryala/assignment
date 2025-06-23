import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export const LinkPrecedence = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
} as const;

export interface ContactAttributes {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: 'primary' | 'secondary';
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type ContactCreationAttributes = Optional<
  Omit<ContactAttributes, 'id'>,
  'linkedId' | 'linkPrecedence' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

const Contact = sequelize.define<Model<ContactAttributes, ContactCreationAttributes>>('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    field: 'phone_number',
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  linkedId: {
    type: DataTypes.INTEGER,
    field: 'linked_id',
    allowNull: true,
  },
  linkPrecedence: {
    type: DataTypes.ENUM('primary', 'secondary'),
    field: 'link_precedence',
    allowNull: false,
    defaultValue: 'primary',
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deleted_at',
    allowNull: true,
  },
}, {
  tableName: 'contacts',
  timestamps: true,
  paranoid: true,
  underscored: true,
});

export default Contact;
