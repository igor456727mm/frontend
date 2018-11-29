import React, { Component } from 'react'
import { Form, Table, Select, Input, InputNumber, DatePicker, Button, message, Upload, Icon, Checkbox, Modal, Popconfirm } from 'antd'
import moment from 'moment'
import { cookie_prefix } from '../../../package.json'
import Cookies from 'js-cookie'
import qs from 'qs'
import { connect } from 'react-redux'
import { Route, Redirect, Switch, NavLink, Link } from 'react-router-dom'
import Helpers, { t, pick, clean, TreeSelectRemote, OfferAccessButton, flatten } from '../../common/Helpers'
import SearchSelect from '../../common/Helpers/SearchSelect'
import api from '../../common/Api'
import * as Feather from 'react-feather'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const Icons = {}

class Advertiser extends Component {

  constructor(props) {
    super(props)
    const { id } = props.match.params
    this.state = {
      isNew: id == 'new',
      isLoading: false,
      data: {
        id: id,
        name: null,
      },
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('Рекламодатель')
    this.fetch()
  }

  fetch = () => {
    const { id } = this.state.data
    const { isNew } = this.state

    if(!isNew) {
      api.get(`/v1/advertisers/${id}`)
      .then(response => {
        this.setState({
          isLoading: false,
          data: response.data
         })
      })
      .catch(e => {
        Helpers.errorHandler(e)
      })
    } else {
      this.setState({ isLoading: false })
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.state
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(data.hasOwnProperty(name)) options.initialValue = data[name]
    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { data, isNew } = this.state
    const { form } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      // values.text = this.refs.text && this.refs.text.getEditorContents().replace("<p><br></p>", "")

      if(isNew) {
        this.setState({ iconLoading: true })
        api.post(`/v1/advertisers`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          window.location = `/advertisers`
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {
        this.setState({ iconLoading: true })
        api.patch(`/v1/advertisers/${data.id}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(`Рекламодатель #${data.name} сохранен`)
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      }

    })
  }

  _onDelete = () => {
    const { data } = this.state
    api.delete(`/v1/advertisers/${data.id}`)
    .then(response => {
      window.location = `/advertisers`
    })
  }


  render() {
    const { isLoading, iconLoading, isNew } = this.state
    return (
      <Form>
      <div className="content__wrapper">
        <div className="content__inner offer">

            <div className="block">
              {this.validator('name', 'Название', <Input size="large" />, [{ required: true }] )}
            </div>

            <div className="flex" style={{ marginTop: '24px' }}>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" onClick={this.handleSubmit} loading={iconLoading}>{t('button.save')}</Button>
            </Form.Item>

            {!isNew && (
              <Form.Item>
                <Button type="danger" htmlType="submit" size="large" style={{ marginLeft: '24px' }} onClick={this._onDelete}>Удалить</Button>
              </Form.Item>
            )}

            </div>

        </div>

      </div>

      </Form>
    )
  }
}

export default connect((state) => pick(state, 'config'))(Form.create()(Advertiser))
