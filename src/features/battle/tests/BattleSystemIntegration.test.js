/*
 * @Author: Claude
 * @Date: 2025-01-27
 * @LastEditors: Claude
 * @LastEditTime: 2025-01-27
 * @Description: 战斗系统集成测试 - 验证适配器架构的基本功能
 */

/**
 * 战斗系统集成测试
 * 
 * 这个测试文件验证新的适配器架构是否正常工作：
 * 1. 独立战斗引擎的基本功能
 * 2. 适配器层的数据转换
 * 3. Redux集成的兼容性
 * 4. Hook系统的响应性
 */

// 模拟测试环境
const mockBattleData = {
  playerUnits: [
    {
      id: 'player_1',
      name: '测试召唤兽1',
      level: 10,
      stats: {
        currentHp: 100,
        maxHp: 100,
        currentMp: 50,
        maxMp: 50,
        physicalAttack: 30,
        speed: 20
      },
      isPlayerUnit: true,
      type: 'player_summon'
    }
  ],
  enemyUnits: [
    {
      id: 'enemy_1',
      name: '测试敌人1',
      level: 8,
      stats: {
        currentHp: 80,
        maxHp: 80,
        currentMp: 30,
        maxMp: 30,
        physicalAttack: 25,
        speed: 15
      },
      isPlayerUnit: false,
      type: 'enemy'
    }
  ]
};

/**
 * 测试1: 独立战斗引擎基本功能
 */
const testBattleEngineBasics = () => {
  console.log('🧪 测试1: 独立战斗引擎基本功能');
  
  try {
    // 动态导入战斗引擎
    import('../engine/BattleEngine.js').then(({ BattleEngine }) => {
      const engine = new BattleEngine();
      
      // 测试初始化
      const initResult = engine.initializeBattle(mockBattleData);
      console.log('✅ 引擎初始化:', initResult ? '成功' : '失败');
      
      // 测试状态获取
      const state = engine.getState();
      console.log('✅ 状态获取:', state ? '成功' : '失败');
      console.log('   - 当前阶段:', state.currentPhase);
      console.log('   - 单位数量:', Object.keys(state.battleUnits).length);
      
      // 测试事件系统
      let eventReceived = false;
      engine.subscribeToEvents((event) => {
        eventReceived = true;
        console.log('✅ 事件接收:', event.type);
      });
      
      // 触发一个测试事件
      engine.advancePhase();
      
      setTimeout(() => {
        console.log('✅ 事件系统:', eventReceived ? '正常' : '异常');
      }, 100);
      
    }).catch(error => {
      console.error('❌ 引擎测试失败:', error);
    });
    
  } catch (error) {
    console.error('❌ 引擎导入失败:', error);
  }
};

/**
 * 测试2: 适配器层数据转换
 */
const testAdapterLayer = () => {
  console.log('🧪 测试2: 适配器层数据转换');
  
  try {
    Promise.all([
      import('../adapters/BattleEngineAdapter.js'),
      import('../adapters/ReduxBattleAdapter.js')
    ]).then(([{ BattleEngineAdapter }, { ReduxBattleAdapter }]) => {
      
      // 模拟dispatch函数
      const mockDispatch = (action) => {
        console.log('📤 Redux Action:', action.type);
      };
      
      const engineAdapter = new BattleEngineAdapter();
      const reduxAdapter = new ReduxBattleAdapter(mockDispatch, engineAdapter);
      
      // 测试初始化
      const initResult = reduxAdapter.initializeBattleFromRedux(mockBattleData);
      console.log('✅ 适配器初始化:', initResult ? '成功' : '失败');
      
      // 测试控制权转移
      reduxAdapter.transferControlToEngine();
      const controlStatus = reduxAdapter.getControlStatus();
      console.log('✅ 控制权转移:', controlStatus.isEngineControlled ? '成功' : '失败');
      
      // 测试状态同步
      const engineState = reduxAdapter.getEngineState();
      console.log('✅ 状态同步:', engineState ? '成功' : '失败');
      
      // 测试选择器代理
      const selectors = reduxAdapter.getSelectorsProxy();
      const isActive = selectors.selectIsBattleActive();
      console.log('✅ 选择器代理:', typeof isActive === 'boolean' ? '成功' : '失败');
      
    }).catch(error => {
      console.error('❌ 适配器测试失败:', error);
    });
    
  } catch (error) {
    console.error('❌ 适配器导入失败:', error);
  }
};

/**
 * 测试3: Hook系统响应性
 */
const testHookSystem = () => {
  console.log('🧪 测试3: Hook系统响应性');
  
  // 这个测试需要在React环境中运行
  console.log('ℹ️  Hook测试需要在React组件中进行');
  console.log('   请在开发环境中打开战斗界面验证Hook功能');
};

/**
 * 测试4: 兼容性验证
 */
const testCompatibility = () => {
  console.log('🧪 测试4: 兼容性验证');
  
  try {
    // 测试简化版Redux Slice
    import('../../../store/slices/battleSliceSimplified.js').then((slice) => {
      console.log('✅ 简化版Slice导入:', slice.default ? '成功' : '失败');
      
      // 测试选择器
      const mockState = {
        battle: {
          isActive: false,
          currentPhase: 'idle',
          battleUnits: {},
          controlMode: 'redux'
        }
      };
      
      const isActive = slice.selectIsBattleActive(mockState);
      const currentPhase = slice.selectCurrentPhase(mockState);
      const controlMode = slice.selectControlMode(mockState);
      
      console.log('✅ 选择器兼容性:', 
        typeof isActive === 'boolean' && 
        typeof currentPhase === 'string' && 
        typeof controlMode === 'string' ? '成功' : '失败');
        
    }).catch(error => {
      console.error('❌ Slice兼容性测试失败:', error);
    });
    
  } catch (error) {
    console.error('❌ 兼容性测试失败:', error);
  }
};

/**
 * 运行所有测试
 */
export const runBattleSystemIntegrationTests = () => {
  console.log('🚀 开始战斗系统集成测试...');
  console.log('=====================================');
  
  testBattleEngineBasics();
  
  setTimeout(() => {
    testAdapterLayer();
  }, 500);
  
  setTimeout(() => {
    testHookSystem();
  }, 1000);
  
  setTimeout(() => {
    testCompatibility();
  }, 1500);
  
  setTimeout(() => {
    console.log('=====================================');
    console.log('✨ 战斗系统集成测试完成');
    console.log('📋 请检查上述输出确认各项功能正常');
  }, 2000);
};

/**
 * 开发环境自动运行测试
 */
if (process.env.NODE_ENV === 'development') {
  // 延迟运行，确保模块加载完成
  setTimeout(() => {
    console.log('🔧 开发环境检测到，自动运行战斗系统测试...');
    runBattleSystemIntegrationTests();
  }, 3000);
}

export default {
  runBattleSystemIntegrationTests,
  testBattleEngineBasics,
  testAdapterLayer,
  testHookSystem,
  testCompatibility
}; 