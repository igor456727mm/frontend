import * as Cookies from 'js-cookie'
import React, { Component } from 'react'
import { Input, Button, Form, message } from 'antd'
import axios from 'axios'
import qs from 'qs'
import api from './Api'
import { domain, cookie_prefix } from '../../package.json'
import { t } from './Helpers'

const Auth = {
  check: async () => {
    const access_token = Cookies.get(`${cookie_prefix}_access_token`)
    const refresh_token = Cookies.get(`${cookie_prefix}_refresh_token`)
    if(!refresh_token) return Auth.exit('refresh_token отсутствует')
    if(!access_token) return await Auth.refreshToken()
    return true
  },
  refreshToken: async () => {
    const refresh_token = Cookies.get(`${cookie_prefix}_refresh_token`)
    if(!refresh_token) return Auth.exit('refresh_token отсутствует')
    return await axios.post(`https://${domain}/auth/?act=refreshAccessToken`, qs.stringify({ access_token: refresh_token }))
    .then(response => {
      const { access_token } = response.data
      if(!access_token) return Auth.exit('обновление токена не дало access_token')
      Cookies.set(`${cookie_prefix}_access_token`, access_token, { expires: 1 / 24 })
      return access_token
    })
    .catch(() => {
      return Auth.exit('при обновлении токена произошла ошибка')
    })
  },
  login: async (login, password) => {
    return await axios.post(`https://${domain}/auth/?act=getAccessToken`, qs.stringify({ login: login, password: password }))
    .then(response => {
      const { access_token, refresh_token, user_id, role } = response.data
      if(!access_token || !refresh_token || !['admin', 'manager'].includes(role)) return false
      Cookies.set(`${cookie_prefix}_access_token`, access_token, { expires: 1 / 24 })
      Cookies.set(`${cookie_prefix}_refresh_token`, refresh_token, { expires: 30 })
      Cookies.set(`${cookie_prefix}_user_id`, user_id, { expires: 365 })
      Cookies.set(`${cookie_prefix}_role`, role, { expires: 365 })
      return true
    })
    .catch(e => {
      return false
    })
  },
  exit: (message) => {
    console.log(message)
    const keys = [`${cookie_prefix}_access_token`, `${cookie_prefix}_refresh_token`, `${cookie_prefix}_user_id`]
    keys.forEach(key => {
      Cookies.remove(key, { domain: `.${domain}` })
      Cookies.remove(key)
    })
    window.dispatchEvent(new Event('user.exit'))
    // if(window.location.hostname !== 'localhost') window.location = `http://${domain}`
    return false
  }
}
class _AuthForm extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
    }
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll( async (err, values) => {
      if(err) return
      Object.keys(values).forEach(key => (values[key] === undefined || !values[key]) && delete values[key])
      this.setState({ iconLoading: true })
      const isAuthorized = await Auth.login(values.login, values.password)
      if(isAuthorized === true) {
        this.props.onLogin()
      } else {
        message.error('Не правильный логин или пароль')
        this.setState({ iconLoading: false })
      }
    })
  }

  validator = (name, input, rules = []) => {
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    return (
      <Form.Item className={`form__field-${name}`}>
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  render() {
    return (
      <div>
        <Form onSubmit={this.handleSubmit}>
          {this.validator('login', <Input placeholder="Email *" size="large" />, [{ required: true, message: ' ' }] )}
          {this.validator('password', <Input type="password" placeholder={t('field.password')} size="large" />, [{ required: true, message: ' ' }] )}
          <Form.Item className="form__field-last">
            <Button type="primary" loading={this.state.iconLoading} htmlType="submit" size="large">{t('button.login')}</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
export const AuthForm = Form.create()(_AuthForm)


export default Auth
