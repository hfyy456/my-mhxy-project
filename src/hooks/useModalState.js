import { useReducer } from 'react';

const initialState = {
  isHistoryModalOpen: false,
  isResultRecordModalOpen: false,
  isSkillCatalogModalOpen: false,
  isPetCatalogModalOpen: false,
  isConfirmDialogOpen: false,
  isMoreFeaturesOpen: false
};

function modalReducer(state, action) {
  switch (action.type) {
    case 'SET_HISTORY_MODAL':
      return { ...state, isHistoryModalOpen: action.payload };
    case 'SET_RESULT_RECORD_MODAL':
      return { ...state, isResultRecordModalOpen: action.payload };
    case 'SET_SKILL_CATALOG_MODAL':
      return { ...state, isSkillCatalogModalOpen: action.payload };
    case 'SET_PET_CATALOG_MODAL':
      return { ...state, isPetCatalogModalOpen: action.payload };
    case 'SET_CONFIRM_DIALOG':
      return { ...state, isConfirmDialogOpen: action.payload };
    case 'SET_MORE_FEATURES':
      return { ...state, isMoreFeaturesOpen: action.payload };
    default:
      return state;
  }
}

export const useModalState = () => {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  return {
    isHistoryModalOpen: state.isHistoryModalOpen,
    setIsHistoryModalOpen: (value) => dispatch({ type: 'SET_HISTORY_MODAL', payload: value }),
    isResultRecordModalOpen: state.isResultRecordModalOpen,
    setIsResultRecordModalOpen: (value) => dispatch({ type: 'SET_RESULT_RECORD_MODAL', payload: value }),
    isSkillCatalogModalOpen: state.isSkillCatalogModalOpen,
    setIsSkillCatalogModalOpen: (value) => dispatch({ type: 'SET_SKILL_CATALOG_MODAL', payload: value }),
    isPetCatalogModalOpen: state.isPetCatalogModalOpen,
    setIsPetCatalogModalOpen: (value) => dispatch({ type: 'SET_PET_CATALOG_MODAL', payload: value }),
    isConfirmDialogOpen: state.isConfirmDialogOpen,
    setIsConfirmDialogOpen: (value) => dispatch({ type: 'SET_CONFIRM_DIALOG', payload: value }),
    isMoreFeaturesOpen: state.isMoreFeaturesOpen,
    setIsMoreFeaturesOpen: (value) => dispatch({ type: 'SET_MORE_FEATURES', payload: value })
  };
}; 