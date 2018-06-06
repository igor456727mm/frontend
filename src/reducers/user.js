const initialState = {
  user_id: null,
  balance: 0.00,
  hold: 0,
  default_revshare_percent: 0,
  unreadMessages: 0,
  platforms: [],
  wallets: [],
  email: '...',
  avatar_image: null,
  manager: {
    avatar: null,
    name: null,
    skype: null,
  }
}

const user = (state = initialState, action) => {
  switch (action.type) {
    case "USER_SET_DATA":
      return { ...state, ...action.params }
      break;
    case "USER_ADD_PLATFORMS":
      return { ...state, platforms: [...state.platforms, ...action.params.platforms] }
      break;
    default:
      return state
  }
}

export default user
