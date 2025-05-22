import { ApiClient } from '../../api/client';
import fetch from 'node-fetch';

// Mock do node-fetch
jest.mock('node-fetch', () => jest.fn());

describe('ApiClient', () => {
    let apiClient: ApiClient;
    const mockApiUrl = 'http://test-api.com';

    beforeEach(() => {
        // Reset dos mocks
        jest.clearAllMocks();
        (fetch as jest.Mock).mockClear();

        // Criar instância do ApiClient
        apiClient = new ApiClient(mockApiUrl);
    });

    describe('constructor', () => {
        it('should create instance with provided API URL', () => {
            expect(apiClient).toBeInstanceOf(ApiClient);
            expect((apiClient as any).apiUrl).toBe(mockApiUrl);
        });

        it('should create instance with default API URL if none provided', () => {
            const defaultClient = new ApiClient();
            expect((defaultClient as any).apiUrl).toBe('http://localhost:3000');
        });
    });

    describe('getUserProductivityData', () => {
        it('should fetch user productivity data successfully', async () => {
            const mockData = {
                focusTime: 120,
                tasksCompleted: 5,
                streak: 3,
                insights: []
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            });

            const result = await apiClient.getUserProductivityData();
            expect(result).toEqual(mockData);
            expect(fetch).toHaveBeenCalledWith(
                `${mockApiUrl}/api/productivity`,
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        it('should handle API errors', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(apiClient.getUserProductivityData()).rejects.toThrow('API Error: 500 Internal Server Error');
        });

        it('should handle network errors', async () => {
            (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await expect(apiClient.getUserProductivityData()).rejects.toThrow('Network error');
        });
    });

    describe('getProductivityHours', () => {
        it('should fetch productivity hours successfully', async () => {
            const mockHours = {
                peakHours: ['09:00-12:00', '14:00-17:00'],
                isPeakTime: true
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockHours)
            });

            const result = await apiClient.getProductivityHours();
            expect(result).toBe(true);
            expect(fetch).toHaveBeenCalledWith(
                `${mockApiUrl}/api/productivity/hours`,
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        it('should handle non-peak hours', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ isPeakTime: false })
            });

            const result = await apiClient.getProductivityHours();
            expect(result).toBe(false);
        });

        it('should handle API errors', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            await expect(apiClient.getProductivityHours()).rejects.toThrow('API Error: 404 Not Found');
        });
    });

    describe('error handling', () => {
        it('should handle malformed JSON responses', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.reject(new Error('Invalid JSON'))
            });

            await expect(apiClient.getUserProductivityData()).rejects.toThrow('Invalid JSON');
        });

        it('should handle timeout errors', async () => {
            (fetch as jest.Mock).mockRejectedValueOnce(new Error('Timeout'));

            await expect(apiClient.getUserProductivityData()).rejects.toThrow('Timeout');
        });

        it('should handle invalid API URL', async () => {
            const invalidClient = new ApiClient('invalid-url');
            (fetch as jest.Mock).mockRejectedValueOnce(new Error('Invalid URL'));

            await expect(invalidClient.getUserProductivityData()).rejects.toThrow('Invalid URL');
        });
    });

    describe('dispose', () => {
        it('should clean up resources', () => {
            apiClient.dispose();
            // Verificar se há alguma limpeza necessária
            // Por exemplo, cancelar requisições pendentes
        });
    });
}); 