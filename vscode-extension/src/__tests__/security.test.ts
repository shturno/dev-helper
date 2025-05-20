import { sanitizeHtml, isValidInput } from '../utils/security';

describe('Security Utils', () => {
    describe('sanitizeHtml', () => {
        it('should remove script tags', () => {
            const input = '<script>alert("xss")</script>Hello';
            expect(sanitizeHtml(input)).toBe('Hello');
        });

        it('should escape HTML characters', () => {
            const input = '<div>Hello & World</div>';
            expect(sanitizeHtml(input)).toBe('&lt;div&gt;Hello &amp; World&lt;/div&gt;');
        });
    });

    describe('isValidInput', () => {
        it('should accept valid input', () => {
            expect(isValidInput('Hello World')).toBe(true);
            expect(isValidInput('Task-123')).toBe(true);
        });

        it('should reject invalid input', () => {
            expect(isValidInput('<script>alert("xss")</script>')).toBe(false);
            expect(isValidInput('')).toBe(false);
        });
    });
}); 