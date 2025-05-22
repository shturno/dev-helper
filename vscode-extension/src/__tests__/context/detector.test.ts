import * as vscode from 'vscode';
import { ContextDetector } from '../../context/detector';
import { HyperfocusManager } from '../../hyperfocus/manager';
import { ApiClient } from '../../api/client';

// Mock do vscode
jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn()
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn()
        }))
    }
}));

// Mock do HyperfocusManager
jest.mock('../../hyperfocus/manager', () => ({
    HyperfocusManager: {
        getInstance: jest.fn(() => ({
            activateHyperfocus: jest.fn()
        }))
    }
}));

// Mock do ApiClient
jest.mock('../../api/client', () => ({
    ApiClient: jest.fn().mockImplementation(() => ({
        getProductivityHours: jest.fn()
    }))
}));

describe('ContextDetector', () => {
    let contextDetector: ContextDetector;
    let mockConfig: vscode.WorkspaceConfiguration;
    let mockHyperfocusManager: jest.Mocked<HyperfocusManager>;
    let mockApiClient: jest.Mocked<ApiClient>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup do mock de configuração
        mockConfig = {
            get: jest.fn()
        } as unknown as vscode.WorkspaceConfiguration;
        (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);

        // Setup do mock do HyperfocusManager
        mockHyperfocusManager = {
            activateHyperfocus: jest.fn()
        } as unknown as jest.Mocked<HyperfocusManager>;
        (HyperfocusManager.getInstance as jest.Mock).mockReturnValue(mockHyperfocusManager);

        // Setup do mock do ApiClient
        mockApiClient = new ApiClient('http://test-api') as jest.Mocked<ApiClient>;

        // Mock do contexto
        const mockContext = {
            globalState: {
                get: jest.fn(),
                update: jest.fn()
            },
            subscriptions: []
        } as unknown as vscode.ExtensionContext;

        // Configurações padrão
        (mockConfig.get as jest.Mock).mockImplementation((key: string) => {
            switch (key) {
                case 'hyperfocus.enabled':
                    return true;
                case 'hyperfocus.fileComplexityThreshold':
                    return 500;
                case 'hyperfocus.peakHours':
                    return ['09:00-12:00', '14:00-17:00'];
                default:
                    return undefined;
            }
        });

        contextDetector = new ContextDetector(mockApiClient, mockContext);
    });

    describe('analyzeDocument', () => {
        it('should ignore non-file documents', async () => {
            const document = {
                uri: { scheme: 'untitled' }
            } as vscode.TextDocument;

            await (contextDetector as any).analyzeDocument(document);
            expect(mockHyperfocusManager.activateHyperfocus).not.toHaveBeenCalled();
        });

        it('should ignore non-code files', async () => {
            const document = {
                uri: { scheme: 'file' },
                fileName: 'test.txt'
            } as vscode.TextDocument;

            await (contextDetector as any).analyzeDocument(document);
            expect(mockHyperfocusManager.activateHyperfocus).not.toHaveBeenCalled();
        });

        it('should not activate hyperfocus when disabled in settings', async () => {
            (mockConfig.get as jest.Mock).mockImplementation((key: string) => {
                if (key === 'hyperfocus.enabled') return false;
                return true;
            });

            const document = {
                uri: { scheme: 'file' },
                fileName: 'test.ts',
                getText: () => '// Complex code\n'.repeat(1000)
            } as vscode.TextDocument;

            await (contextDetector as any).analyzeDocument(document);
            expect(mockHyperfocusManager.activateHyperfocus).not.toHaveBeenCalled();
        });

        it('should activate hyperfocus for complex files', async () => {
            const document = {
                uri: { scheme: 'file' },
                fileName: 'test.ts',
                getText: () => '// Complex code\n'.repeat(1000)
            } as vscode.TextDocument;

            await (contextDetector as any).analyzeDocument(document);
            expect(mockHyperfocusManager.activateHyperfocus).toHaveBeenCalledWith(
                expect.objectContaining({
                    reason: 'complex_file',
                    complexity: expect.any(Number),
                    fileName: 'test.ts'
                })
            );
        });

        it('should activate hyperfocus during peak hours', async () => {
            // Mock da hora atual para um horário de pico
            const mockDate = new Date('2024-01-01T10:00:00');
            jest.useFakeTimers().setSystemTime(mockDate);

            const document = {
                uri: { scheme: 'file' },
                fileName: 'test.ts',
                getText: () => '// Simple code'
            } as vscode.TextDocument;

            (mockApiClient.getProductivityHours as jest.Mock).mockResolvedValue(true);

            await (contextDetector as any).analyzeDocument(document);
            expect(mockHyperfocusManager.activateHyperfocus).toHaveBeenCalledWith(
                expect.objectContaining({
                    reason: 'peak_time',
                    fileName: 'test.ts'
                })
            );

            jest.useRealTimers();
        });
    });

    describe('calculateComplexity', () => {
        it('should calculate complexity based on file content', () => {
            const document = {
                getText: () => `
                    // Complex code with many lines
                    function complexFunction() {
                        if (condition) {
                            for (let i = 0; i < 10; i++) {
                                while (anotherCondition) {
                                    try {
                                        // Nested code
                                    } catch (error) {
                                        // Error handling
                                    }
                                }
                            }
                        }
                    }
                `
            } as vscode.TextDocument;

            const complexity = (contextDetector as any).calculateComplexity(document);
            expect(complexity).toBeGreaterThan(0);
        });

        it('should return 0 for empty files', () => {
            const document = {
                getText: () => ''
            } as vscode.TextDocument;

            const complexity = (contextDetector as any).calculateComplexity(document);
            expect(complexity).toBe(0);
        });

        it('should consider different types of code complexity', () => {
            const document = {
                getText: () => `
                    // Complex code with different patterns
                    class ComplexClass {
                        private method1() {
                            if (condition1 && condition2 || condition3) {
                                return this.method2().method3();
                            }
                        }
                        async method2() {
                            await Promise.all([
                                this.method3(),
                                this.method4()
                            ]);
                        }
                    }
                `
            } as vscode.TextDocument;

            const complexity = (contextDetector as any).calculateComplexity(document);
            expect(complexity).toBeGreaterThan(0);
        });
    });

    describe('checkProductivityHours', () => {
        it('should return true during peak hours', async () => {
            const mockDate = new Date('2024-01-01T10:00:00');
            jest.useFakeTimers().setSystemTime(mockDate);

            (mockApiClient.getProductivityHours as jest.Mock).mockResolvedValue(true);
            const isPeakTime = await (contextDetector as any).checkProductivityHours();
            expect(isPeakTime).toBe(true);

            jest.useRealTimers();
        });

        it('should return false outside peak hours', async () => {
            const mockDate = new Date('2024-01-01T13:00:00');
            jest.useFakeTimers().setSystemTime(mockDate);

            (mockApiClient.getProductivityHours as jest.Mock).mockResolvedValue(false);
            const isPeakTime = await (contextDetector as any).checkProductivityHours();
            expect(isPeakTime).toBe(false);

            jest.useRealTimers();
        });

        it('should handle API errors gracefully', async () => {
            (mockApiClient.getProductivityHours as jest.Mock).mockRejectedValue(new Error('API Error'));
            const isPeakTime = await (contextDetector as any).checkProductivityHours();
            expect(isPeakTime).toBe(false);
        });
    });

    describe('isCodeFile', () => {
        it('should identify code files correctly', () => {
            const codeFiles = [
                'test.ts',
                'component.jsx',
                'style.css',
                'app.py',
                'main.go',
                'index.html'
            ];

            codeFiles.forEach(fileName => {
                expect((contextDetector as any).isCodeFile({ fileName } as vscode.TextDocument)).toBe(true);
            });
        });

        it('should reject non-code files', () => {
            const nonCodeFiles = [
                'test.txt',
                'document.pdf',
                'image.png',
                'data.json',
                'config.yaml'
            ];

            nonCodeFiles.forEach(fileName => {
                expect((contextDetector as any).isCodeFile({ fileName } as vscode.TextDocument)).toBe(false);
            });
        });
    });
}); 