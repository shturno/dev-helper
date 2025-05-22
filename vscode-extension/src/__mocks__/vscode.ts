export const window = {
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showInputBox: jest.fn(),
  showQuickPick: jest.fn(),
  createStatusBarItem: jest.fn(() => ({
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn(),
    text: '',
    tooltip: '',
    command: '',
  })),
  createWebviewPanel: jest.fn(() => ({
    webview: {
      html: '',
      postMessage: jest.fn(),
      onDidReceiveMessage: jest.fn(),
    },
    reveal: jest.fn(),
    onDidDispose: jest.fn(),
    dispose: jest.fn(),
  })),
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
};

export const ViewColumn = {
  One: 1,
};

export const commands = {
  registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn((_key, _defaultValue) => _defaultValue),
    update: jest.fn()
  }))
};

export class Disposable {
  dispose() {}
}

export class ExtensionContext {
  globalState = {
    get: jest.fn(() => []),
    update: jest.fn(() => Promise.resolve()),
  };
  subscriptions: any[] = [];
}

// Mock para ApiClient usado em alguns testes
export class ApiClient {
  getUserProductivityData = jest.fn().mockResolvedValue({});
} 