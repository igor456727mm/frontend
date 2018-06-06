import React, { Component } from 'react'
import { Form, Input, InputNumber, Button, Select, message, Upload, Icon } from 'antd'
import qs from 'qs'
import * as Cookies from 'js-cookie'
import { connect } from 'react-redux'
import api from '../../common/Api'
import Helpers, { t, pick } from '../../common/Helpers'

class Personal extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      data: {
        name: null,
        email: null,
        userData: {
          contacts: {},
        }
      },
      avatar_upload_image_id: null,
      new_avatar: null,
    }
  }

  componentDidMount = () => {
    // Helpers.isLoading(true)
    const { user_id } = Cookies.get()
    api.get(`/v1/users/${user_id}`)
    .then(response => {
      this.setState({ data: response.data })
      //Helpers.isLoading(false)
    })
    .catch(e => {
      //Helpers.isLoading(false)
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
    }
    return (
      <Form.Item>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form } = this.props
    const { user_id } = Cookies.get()
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      if(this.state.avatar_upload_image_id) values.userData['avatar_upload_image_id'] = this.state.avatar_upload_image_id
      this.setState({ iconLoading: true })
      api.patch(`/v1/users/${user_id}`, qs.stringify(values))
      .then(response => {
        this.setState({ iconLoading: false })
        message.success(t('message.save'))
        if(this.state.avatar_upload_image_id) Helpers.checkUserData()
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        Helpers.errorHandler(e)
      })
    })
  }

  _test = (e) => {
    const data = e.file.response
    if(!data) return
    this.setState({
      avatar_upload_image_id: data.id,
      new_avatar: data.server + data.patch,
    })
  }

  render() {
    const { iconLoading, new_avatar, data } = this.state
    return (
      <div className="profile__personal">
        <Form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-2">
              {this.validator('avatar_upload_image_id', t('field.avatar'), (
                <Upload
                  onChange={this._test}
                  name="image"
                  action={`https://file.yb.partners/v1/uploads?access_token=${Cookies.get('access_token')}`}
                  showUploadList={false}
                  listType="picture-card"
                  className="avatar-uploader"
                  >
                  {new_avatar ? <img src={new_avatar} /> : (data.userData.avatar_image ? <img src={data.userData.avatar_image} /> : <Icon type={'plus'} /> )}
                </Upload>
              ))}
            </div>
            <div className="col-md-4">
              {/* this.validator('avatar_upload_image_id', t('avatar_upload_image_id'), <Input size="large" />, [{ required: true }] ) */}
              {this.validator('name', t('field.uname'), <Input size="large" />, [{ required: true }] )}
              {this.validator('userData[contacts][skype]', t('field.skype'), <Input size="large" /> )}
            </div>
            <div className="col-md-6">
              {this.validator('email', t('field.email'), <Input size="large" />, [{ required: true }] )}
              {this.validator('userData[contacts][phone]', t('field.phone'), <Input size="large" /> )}
            </div>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>{t('button.save')}</Button>
          </Form.Item>
        </Form>
      </div>
    )

  }


}



export default connect((state) => pick(state, 'user'))(Form.create()(Personal))
