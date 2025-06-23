import request from 'supertest';
import { createApp } from '../src/app';
import { sequelize } from '../src/config/database';
import Contact from '../src/models/contact.model';

let app: any;
let api: any;

beforeAll(async () => {
  app = await createApp();
  api = request(app);
});

describe('Contact Identification API', () => {
  beforeEach(async () => {
    await Contact.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe('POST /identify', () => {
    it('should create a new primary contact when no contact exists', async () => {
      const response = await api
        .post('/api/identify')
        .send({
          email: 'test@example.com',
          phoneNumber: '1234567890'
        });

      expect(response.status).toBe(200);
      expect(response.body.contact).toHaveProperty('primaryContatctId');
      expect(response.body.contact.emails).toContain('test@example.com');
      expect(response.body.contact.phoneNumbers).toContain('1234567890');
      expect(response.body.contact.secondaryContactIds).toHaveLength(0);
    });

    it('should return existing contact when same email and phone are provided', async () => {
      const firstResponse = await api
        .post('/api/identify')
        .send({
          email: 'test@example.com',
          phoneNumber: '1234567890'
        });

      const response = await api
        .post('/api/identify')
        .send({
          email: 'test@example.com',
          phoneNumber: '1234567890'
        });

      expect(response.status).toBe(200);
      expect(response.body.contact.primaryContatctId).toBe(firstResponse.body.contact.primaryContatctId);
      expect(response.body.contact.emails).toContain('test@example.com');
      expect(response.body.contact.phoneNumbers).toContain('1234567890');
      expect(response.body.contact.secondaryContactIds).toHaveLength(0);
    });

    it('should link contacts when email matches existing contact', async () => {
      await api
        .post('/api/identify')
        .send({
          email: 'test@example.com',
          phoneNumber: '1234567890'
        });
      const response = await api
        .post('/api/identify')
        .send({
          email: 'test@example.com',
          phoneNumber: '0987654321'
        });

      expect(response.status).toBe(200);
      expect(response.body.contact.emails).toContain('test@example.com');
      expect(response.body.contact.phoneNumbers).toContain('1234567890');
      expect(response.body.contact.phoneNumbers).toContain('0987654321');
      expect(response.body.contact.secondaryContactIds).toHaveLength(1);
    });

    it('should link contacts when phone matches existing contact', async () => {
      await api
        .post('/api/identify')
        .send({
          email: 'test@example.com',
          phoneNumber: '1234567890'
        });

      const response = await api
        .post('/api/identify')
        .send({
          email: 'test2@example.com',
          phoneNumber: '1234567890'
        });

      expect(response.status).toBe(200);
      expect(response.body.contact.emails).toContain('test@example.com');
      expect(response.body.contact.emails).toContain('test2@example.com');
      expect(response.body.contact.phoneNumbers).toContain('1234567890');
      expect(response.body.contact.secondaryContactIds).toHaveLength(1);
    });

    it('should handle case where both email and phone match different contacts', async () => {
      await api
        .post('/api/identify')
        .send({
          email: 'test@example.com',
          phoneNumber: '1234567890'
        });

      await api
        .post('/api/identify')
        .send({
          email: 'test2@example.com',
          phoneNumber: '1234567890'
        });

      const response = await api
        .post('/api/identify')
        .send({
          email: 'test@example.com',
          phoneNumber: '0987654321'
        });

      expect(response.status).toBe(200);
      expect(response.body.contact.emails).toContain('test@example.com');
      expect(response.body.contact.emails).toContain('test2@example.com');
      expect(response.body.contact.phoneNumbers).toContain('1234567890');
      expect(response.body.contact.phoneNumbers).toContain('0987654321');
      expect(response.body.contact.secondaryContactIds).toHaveLength(2);
    });

    it('should return 400 if neither email nor phone is provided', async () => {
      const response = await api
        .post('/api/identify')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email or phoneNumber is required');
    });

    it('should handle null/undefined values correctly', async () => {
      const response1 = await api
        .post('/api/identify')
        .send({ email: null, phoneNumber: '1234567890' });
      expect(response1.status).toBe(200);
      expect(response1.body.contact.phoneNumbers).toContain('1234567890');

      const response2 = await api
        .post('/api/identify')
        .send({ email: 'test@example.com', phoneNumber: undefined });
      expect(response2.status).toBe(200);
      expect(response2.body.contact.emails).toContain('test@example.com');
    });

    it('should reject invalid email formats', async () => {
      const response = await api
        .post('/api/identify')
        .send({ email: 'invalid-email', phoneNumber: '1234567890' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation error');
    });

    it('should accept long phone numbers', async () => {
      const longPhone = '1'.repeat(30);
      const response = await api
        .post('/api/identify')
        .send({ email: 'test@example.com', phoneNumber: longPhone });
      
      expect(response.status).toBe(200);
      expect(response.body.contact.phoneNumbers).toContain(longPhone);
    });

    it('should handle valid special characters in inputs', async () => {
      const email = 'test+special@example.com';
      const phone = '+11234567890'; 
      
      const response = await api
        .post('/api/identify')
        .send({ email, phoneNumber: phone });
      
      expect(response.status).toBe(200);
      expect(response.body.contact.emails).toContain(email);
      expect(response.body.contact.phoneNumbers).toContain(phone);
    });

    it('should handle multiple levels of linking', async () => {
      const firstResponse = await api.post('/api/identify').send({ email: 'a@example.com', phoneNumber: '1111111111' });
      const primaryId = firstResponse.body.contact.primaryContatctId;
      
      await api.post('/api/identify').send({ email: 'a@example.com', phoneNumber: '2222222222' });
      await api.post('/api/identify').send({ email: 'b@example.com', phoneNumber: '2222222222' });
      
      const response = await api.post('/api/identify').send({ email: 'a@example.com' });
      
      expect(response.status).toBe(200);
      expect(response.body.contact.primaryContatctId).toBe(primaryId);
      expect(response.body.contact.emails).toContain('a@example.com');
      expect(response.body.contact.emails).toContain('b@example.com');
      expect(response.body.contact.phoneNumbers).toContain('1111111111');
      expect(response.body.contact.phoneNumbers).toContain('2222222222');
      expect(response.body.contact.secondaryContactIds).toHaveLength(2);
    });

    it('should handle empty strings and whitespace', async () => {
      const response1 = await api
        .post('/api/identify')
        .send({ email: '', phoneNumber: '1234567890' });
      expect(response1.status).toBe(200);
      expect(response1.body.contact.phoneNumbers).toContain('1234567890');
      expect(response1.body.contact.emails).toHaveLength(0);

      const response2 = await api
        .post('/api/identify')
        .send({ email: 'test@example.com', phoneNumber: ' 123 456 7890 ' });
      expect(response2.status).toBe(200);
      expect(response2.body.contact.phoneNumbers).toContain(' 123 456 7890 ');
    });

    it('should handle case sensitivity in emails', async () => {
      const firstResponse = await api
        .post('/api/identify')
        .send({ email: 'Test@Example.COM', phoneNumber: '123' });
      
      const response = await api
        .post('/api/identify')
        .send({ email: 'test@example.com', phoneNumber: '456' });
      
      expect(response.status).toBe(200);
      expect(response.body.contact.primaryContatctId).toBe(firstResponse.body.contact.primaryContatctId);
      expect(response.body.contact.emails).toContain('Test@Example.COM');
      expect(response.body.contact.phoneNumbers).toContain('123');
      expect(response.body.contact.phoneNumbers).toContain('456');
      expect(response.body.contact.secondaryContactIds).toHaveLength(1);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill(0).map((_, i) => 
        api.post('/api/identify').send({ 
          email: `user${i}@example.com`,
          phoneNumber: `12345${i}`
        })
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      const primaryCount = responses.filter(
        r => r.body.contact.secondaryContactIds.length === 0
      ).length;
      expect(primaryCount).toBe(5);
    });
  });
});
