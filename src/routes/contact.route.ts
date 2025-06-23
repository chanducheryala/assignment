import { Router, Response, NextFunction } from 'express';
import { Request } from 'express';
import { identify, deleteAll } from '../controllers/contact.controller';

const router = Router();

interface IdentifyRequest extends Request {
  body: {
    email?: string;
    phoneNumber?: string;
  };
}

const identifyHandler = async (req: IdentifyRequest, res: Response, next: NextFunction) => {
  try {
    await identify(req, res);
  } catch (error) {
    next(error);
  }
};

const deleteAllHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteAll(req, res);
  } catch (error) {
    next(error);
  }
};

router.post('/identify', identifyHandler);
router.delete('/contacts', deleteAllHandler);

export default router;
