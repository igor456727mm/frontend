import React, { Component } from 'react'
import { Form, Button, message, Icon } from 'antd'
import Helpers, { t, clean } from './Helpers'
import api from './Api'
import qs from 'qs'
import * as Feather from 'react-feather'
import * as Manager from './Helpers/ManagerSelect'

const options = {
  size: 'large',
  getPopupContainer: () => document.getElementById('content'),
}

const managerData = {
  personalManager: {
    field: 'personal_manager_id',
    apiPatchUrl: '/v1/user-data/',
  },
  advertiserManager: {
    field: 'advertiser_manager_id',
    apiPatchUrl: '/v1/advertisers/',
  },
}

class _ChangingManager extends Component {

  constructor(props) {
    super(props)
    this.state = {
      showForm: false,
      name: '',
      id: '',
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { managerId } = this.props
    const { id } = this.state
    const { getFieldDecorator } = this.props.form
    const actualManagerId = id ? String(id) : String(managerId || '')
    const options = { rules: rules }
    if (id || managerId) {
      options.initialValue = actualManagerId
    }
    return (
      <Form.Item className={`form__item-${name}`}>
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, id, managerType, managers } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)
      api.patch(`${managerData[managerType].apiPatchUrl}${id}`, qs.stringify(values))
      .then(response => {
        const newManager = managers.find(el => String(el.id) === String(values[managerData[managerType].field]))
        this.setState({ showForm: false, name: newManager.name, id: newManager.id })
        message.success(t(`Имя менеджера изменено на ${newManager.name}`))
      })
      .catch(e => {
        Helpers.errorHandler(e)
      })
    })
  }

  toggle = () => this.setState({ showForm: !this.state.showForm })

  render() {
    const { showForm, name, managers } = this.state
    const managerName = name ? name : this.props.name
    const { managerType } = this.props
    return (
      <div>
        {!showForm ?
          <div className="manager">
            <span className="manager__name">
              {managerName}
            </span>
            <Button onClick={this.toggle} className="manager__btn"><Feather.Settings /></Button>
          </div>
        :
          <div className="manager">
            <Form>
              {this.validator(managerData[managerType].field, '', <Manager.Select managerType={managerType} multiple={false} {...options} /> )}
            </Form>
            <div className="manager__btns">
              <Button onClick={this.toggle} className="manager__btn"><Icon type="close-circle-o" /></Button>
              <Button onClick={this.handleSubmit} className="manager__btn submit"><Icon type="check-circle-o" /></Button>
            </div>
          </div>
        }
      </div>
    )
  }
}

const ChangingManager = Form.create()(_ChangingManager)

export default ChangingManager
