import { ApiClient } from '../api/types';

export declare class ContextDetector {
    constructor(apiClient: ApiClient);
    initialize(): void;
    dispose(): void;
} 