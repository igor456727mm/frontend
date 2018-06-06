import axios from 'axios'
import Auth from './Auth'
import * as Cookies from 'js-cookie'
import moment from 'moment'

const api = axios.create({
  baseURL: 'https://admin-api.yb.partners',
})

const utcOffset = moment().utcOffset()

// добавление токена при request!
api.interceptors.request.use(config => {
  const access_token = Cookies.get('access_token')
  config.headers['Authorization'] = `Bearer ${access_token}`
  config.headers['Accept-Language'] = Cookies.get('lang')
  config.headers['Time-Offset'] = utcOffset
  return config
}, error => {
  return Promise.reject(error)
})

// выход при status 401
api.interceptors.response.use(response => {
   return response
}, async (error) => {

  if(error.response && error.response.status == 401) {
    const Authorization = error.config.headers['Authorization'].length > 16
    if(!Authorization) { // проба на переполучение токена
      const access_token = await Auth.refreshToken()
      error.config.headers['Authorization'] = `Bearer ${access_token}`
      return axios.request(error.config)
    } else {
      Auth.exit('401 доступ запрещен')
    }
  } else if(error.response && error.response.status == 429) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return axios.request(error.config)
  }
  // if 429 send 2nd
  return Promise.reject(error)
})

export default api
