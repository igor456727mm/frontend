import React, { Component } from 'react'
import { Form, Table, Icon, Divider, Select, Input, Button, message, Popconfirm, Tooltip,  DatePicker, Modal, Popover, TreeSelect } from 'antd'
import Helpers, { Events, Filters, t, pick, clean, disabledDate, TreeSelectRemote, queryParams } from './Helpers'
import api from './Api'
import axios from 'axios'
import { connect } from 'react-redux'
import moment from 'moment'
import locale from 'antd/lib/date-picker/locale/ru_RU'
import qs from 'qs'
import _ from 'lodash'
import * as Feather from 'react-feather'
import * as Manager from './Helpers/ManagerSelect'

const options = {
  size: 'large',
  getPopupContainer: () => document.getElementById('content'),
}

class _ChangingManager extends Component {

  constructor(props) {
    super(props)
    this.state = {
      showForm: false,
      name: this.props.name || '',
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { id } = this.props
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules, initialValue: String(id) }
    return (
      <Form.Item className={`form__item-${name}`}>
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, user_id, managerType, managers } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)
      api.patch(`/v1/user-data/${user_id}`, qs.stringify(values))
      .then(response => {
        const newManager = managers.find(el => String(el.id) === String(values.personal_manager_id))
        this.setState({ showForm: false, name: newManager.name })
        message.success(t('Имя менеджера изменено'))
      })
      .catch(e => {
        Helpers.errorHandler(e)
      })
    })
  }

  toggle = () => this.setState({ showForm: !this.state.showForm })

  render() {
    const { showForm, name, managers } = this.state
    const { managerType } = this.props
    return (
      <div>
        {!showForm ?
          <div className="personalManager">
            <span className="personalManager__name">
              {name}
            </span>
            <Button onClick={this.toggle} className="personalManager__btn">{name && <Feather.Settings />}</Button>
          </div>
        :
          <div className="personalManager">
            <Form>
              {this.validator('personal_manager_id', Manager.data[managerType].title, <Manager.Select getManagers={this.getManagers} managerType={managerType} multiple={false} {...options} /> )}
            </Form>
            <div className="personalManager__btns">
              <Button onClick={this.toggle} className="personalManager__btn"><Feather.XCircle /></Button>
              <Button onClick={this.handleSubmit} className="personalManager__btn submit"><Feather.CheckCircle /></Button>
            </div>
          </div>
        }
      </div>
    )
  }
}

const ChangingManager = Form.create()(_ChangingManager)

export default ChangingManager
