export class ChatUtils {
  static formatTime(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  }

  static getDateLabel(date: Date | string): string {
    const d = new Date(date);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (d.toDateString() === today) return 'Bugun';
    if (d.toDateString() === yesterday) return 'Kecha';

    return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
  }

  static getAvatarColor(name: string): string {
    if (!name) return '#3b82f6';
    const colors = [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#84cc16',
      '#6366f1',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
