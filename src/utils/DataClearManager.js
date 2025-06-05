/**
 * @description: 用于处理版本迭代造成的数据兼容性问题，提供一次性清理或迁移数据的功能
 */
class DataClearManager {
  constructor() {
    this.store = window.electronAPI?.store;
    this.CLEARED_FLAG_KEY = 'data-structure-v2-cleared';
  }

  /**
   * 检查并清除旧的、没有 sourceId 的背包数据
   * 这是为了解决从旧数据结构升级到需要 sourceId 的新结构时产生的兼容性问题
   */
  async clearInvalidInventoryData() {
    if (!this.store) {
      console.log('[DataClearManager] Electron Store not available, skipping data check.');
      return;
    }

    // 检查是否已经执行过清理，避免每次启动都检查
    const hasCleared = await this.store.get(this.CLEARED_FLAG_KEY);
    if (hasCleared) {
      console.log('[DataClearManager] Data has been cleared or validated before, skipping.');
      return;
    }

    try {
      const savedState = await this.store.get("inventoryState");
      
      if (savedState && savedState.items && savedState.items.length > 0) {
        // 检查第一个物品的数据结构
        // savedState.items 是一个 [id, itemData] 结构的数组
        const firstItemData = savedState.items[0][1];
        
        // 如果第一个物品没有 sourceId，我们假设整个存档是旧的
        if (firstItemData && typeof firstItemData.sourceId === 'undefined') {
          console.warn('[DataClearManager] Detected legacy inventory data (missing sourceId). Clearing the inventory state.');
          
          // 清除损坏的存档
          await this.store.delete('inventoryState');
          
          console.log('[DataClearManager] Legacy inventory state has been cleared.');
          
          // 设置标志，表示清理已完成
          await this.store.set(this.CLEARED_FLAG_KEY, true);
        } else {
           // 数据是有效的，同样设置标志，以后不再检查
           await this.store.set(this.CLEARED_FLAG_KEY, true);
        }
      } else {
        // 没有数据或数据为空，也视为"已检查"
        await this.store.set(this.CLEARED_FLAG_KEY, true);
      }
    } catch (error) {
      console.error('[DataClearManager] Error while checking/clearing inventory data:', error);
    }
  }
}

export default DataClearManager; 