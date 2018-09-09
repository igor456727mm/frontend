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

class Offer extends Component {

  constructor(props) {
    super(props)
    const { id } = props.match.params
    this.state = {
      isNew: id == 'new',
      isLoading: false,
      data: {
        id: id,
        description: null,
        text: null,
        visible: 1,
        important: 1
      },
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.news')
    const { isNew } = this.state

    this.fetch()
  }

  componentWillUnmount = () => {

  }

  fetch = () => {
    const { id } = this.state.data
    const { isNew } = this.state
    if(!isNew) {
      api.get(`/v1/news/${id}?expand=offer`)
      .then(response => {
        response.data.visible = response.data.visible == true ? 1 : 0
        response.data.important = response.data.important == true ? 1 : 0
        this.setState({
          isLoading: false,
          data: response.data
         })
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
    const { data, logo_upload_image_id, isNew } = this.state
    const { form } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      // console.log(values);
      //values = clean(values)

      // text
      values.text = this.refs.text && this.refs.text.getEditorContents().replace("<p><br></p>", "")

      if(isNew) {
        api.post(`/v1/news`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          window.location = `/news/${response.data.id}`
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {
        api.patch(`/v1/news/${data.id}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(`Новость #${data.id} сохранена`)
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
    api.delete(`/v1/news/${data.id}`)
    .then(response => {
      window.location = `/news`
    })
  }


  render() {
    const { isLoading, iconLoading, isNew, data } = this.state
    const { currencies } = this.props.config
    return (
      <Form>
      <div className="content__wrapper">
        <div className="content__inner offer">

            <div className="block">
              {this.validator('name', 'Название', <Input size="large" />, [{ required: true }] )}
              {this.validator('description', 'Краткое описание', <Input size="large" /> )}
              <div className="ant-row ant-form-item">
                <h4>Описание</h4>
                {((!isLoading && data.text) || (!isLoading && isNew)) && <ReactQuill ref="text" defaultValue={data.text} />}
              </div>
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
        <div className="content__sidebar">
          <div className="block offer__params">

            <div className="offer__params-global">
              <h3>Параметры</h3>
              {this.validator('visible', 'Видимый', <Select size="large"><Select.Option key={1} value={1}>Да</Select.Option><Select.Option key={0} value={0}>Нет</Select.Option></Select> )}
              {this.validator('important', 'Показывать в сайдбаре', <Select size="large"><Select.Option key={1} value={1}>Да</Select.Option><Select.Option key={0} value={0}>Нет</Select.Option></Select> )}
            </div>

          </div>
        </div>
      </div>


      </Form>
    )
  }
}

export default connect((state) => pick(state, 'config'))(Form.create()(Offer))
