import * as vscode from 'vscode';

export class Notifier {
  static remindFocusMode() {
    vscode.window.showInformationMessage(
      'Você está há um tempo sem usar o modo hiperfoco. Deseja ativar agora?',
      'Ativar Modo Foco'
    ).then(selection => {
      if (selection === 'Ativar Modo Foco') {
        vscode.commands.executeCommand('dev-helper.startFocus');
      }
    });
  }

  static suggestBreak() {
    vscode.window.showInformationMessage(
      'Ótimo trabalho! Considere fazer uma pausa rápida para manter sua produtividade.'
    );
  }

  static congratulateTaskCompletion(taskTitle: string) {
    vscode.window.showInformationMessage(
      `Parabéns! Você concluiu a tarefa "${taskTitle}".`
    );
  }

  static congratulateStreak(days: number) {
    vscode.window.showInformationMessage(
      `Incrível! Você atingiu uma sequência de ${days} dias de foco. Continue assim!`
    );
  }
}
