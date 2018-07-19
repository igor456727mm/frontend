import React, { Component } from 'react'
import { Form, Input, InputNumber, Button, Select, message, Checkbox, Upload, Icon } from 'antd'
import qs from 'qs'
import * as Cookies from 'js-cookie'
import { connect } from 'react-redux'
import api from '../../../common/Api'
import Helpers, { t, pick, flatten } from '../../../common/Helpers'
import { domain, cookie_prefix } from '../../../../package.json'

class Personal extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      data: {
        name: null,
        email: null,
        status: 'waiting_confirmation',
        userData: {
          contacts: {},
          confirmed: false,
          about: null,
          reason_of_ban: null,
          banned: false,
        }
      },
      avatar_upload_image_id: null,
      new_avatar: null,
    }
  }

  componentDidMount = () => {
    const { user_id } = this.props
    api.get(`/v1/users/${user_id}?expand=userData`)
    .then(response => {
      this.setState({ data: response.data })
    })
    .catch(e => {
      Helpers.errorHandler(e)
    })
  }

  validator = (name, label, input, rules = []) => {
    const { data } = this.state
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(data[name]) {
      options.initialValue = data[name]
    } else if(name.includes('userData[contacts]')) {
      const _name = name.split('[')[2].replace(']', '')
      options.initialValue = data.userData.contacts[_name]
    } else if(name == 'userData[currency_id]') {
      options.initialValue = data.userData.currency_id
    } else if(name == 'userData[time_offset]') {
      options.initialValue = data.userData.time_offset
    } else if(data && name.includes('.')) {
      const tmp = data && flatten(data) || {}
      options.initialValue = tmp[name]
    }

    if(name == 'userData.confirmed' || name == 'userData.banned') options.valuePropName = 'checked'

    return (
      <Form.Item>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { data } = this.state
    const { form } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      delete values.avatar_upload_image_id
      if(this.state.avatar_upload_image_id) values.userData['avatar_upload_image_id'] = this.state.avatar_upload_image_id
      values.userData.confirmed = values.userData.confirmed ? 1 : 0
      values.userData.banned = values.userData.banned ? 1 : 0
      this.setState({ iconLoading: true })
      api.patch(`/v1/users/${data.id}`, qs.stringify(values))
      .then(response => {
        this.setState({ iconLoading: false })
        message.success(t('message.save'))
        //if(this.state.avatar_upload_image_id || data.userData.currency_id !== currency_id ) Helpers.checkUserData()
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        Helpers.errorHandler(e)
      })
    })
  }

  _onUpload = (e) => {
    const data = e.file.response
    if(!data) return
    this.setState({
      avatar_upload_image_id: data.id,
      new_avatar: data.server + data.patch,
    })
  }

  render() {
    const { iconLoading, new_avatar, data, tariffs } = this.state
    const values = this.props.form.getFieldsValue()
    return (
      <div className="block profile__personal">
        <h2>Общая информация</h2>
        <Form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-4">
              {this.validator('login', 'Логин', <Input size="large" />, [{ required: true }] )}
              {this.validator('email', t('field.email'), <Input size="large" />, [{ required: true }] )}
              {this.validator('status', 'Статус', (
                <Select size="large">
                  <Select.Option key={0} value="waiting_confirmation">Ожидает подтверждения</Select.Option>
                  <Select.Option key={1} value="active">Активен</Select.Option>
                </Select>
              ), [{ required: true }] )}
              <Form.Item>
                <h4>Реферальная ссылка</h4>
                <Input disabled size="large" value={`https://gambling.pro?ref_id=${data.id}`} />
              </Form.Item>
              {this.validator('userData.confirmed', '', <Checkbox size="large">Верифицирован</Checkbox> )}
            </div>
            <div className="col-md-4">
              {this.validator('name', t('field.uname'), <Input size="large" /> )}
              {this.validator('userData.contacts.phone', t('field.phone'), <Input size="large" /> )}
              {this.validator('userData.contacts.skype', 'Skype', <Input size="large" /> )}
              {this.validator('userData.contacts.telegram', 'Telegram', <Input size="large" /> )}
            </div>
            <div className="col-md-4">
              {this.validator('avatar_upload_image_id', t('field.avatar'), (
                <Upload
                  onChange={this._onUpload}
                  name="image"
                  action={`https://file-s1.gambling.pro/v1/uploads?access_token=${Cookies.get(cookie_prefix+'_access_token')}`}
                  showUploadList={false}
                  listType="picture-card"
                  className="avatar-uploader"
                  >
                  {new_avatar ? <img src={new_avatar} /> : (data.userData && data.userData.avatar_image ? <img src={data.userData.avatar_image} /> : <Icon type={'plus'} /> )}
                </Upload>
              ))}
              {this.validator('userData.about', 'About', <Input.TextArea rows={5} disabled size="large" /> )}
            </div>
          </div>

          <hr />
          <div className="row">
            <div className="col-md-8">
              {this.validator('userData.reason_of_ban', 'Причина бана', <Input.TextArea rows={5} size="large" /> )}
              {this.validator('userData.banned', '', <Checkbox size="large">Забанен</Checkbox> )}
            </div>
            <div className="col-md-4">
              {this.validator('userData.comments', 'Заметка о пользователе', <Input.TextArea rows={5} size="large" /> )}
            </div>
          </div>

          <Form.Item className="form__item-last">
            <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>Сохранить</Button>
          </Form.Item>
        </Form>
      </div>
    )

  }


}



export default connect((state) => pick(state, 'user'))(Form.create()(Personal))
