const initialState = {
  title: '',
  isLoading: false,
}

const config = (state = initialState, action) => {
  switch (action.type) {
    case 'CONFIG_SET':
      return { ...state, ...action.params }
      break;
    case 'TOGGLE_SPINNER':
      return { ...state, isLoading: action.show }
      break;
    default:
      return state
  }
}

export default config
