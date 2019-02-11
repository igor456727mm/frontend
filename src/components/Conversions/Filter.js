import React, { Component } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Form, Table, Icon, Divider, Select, Input, Button, message, Popconfirm, Tooltip,  DatePicker, Modal, TreeSelect } from 'antd'
import Helpers, { Filters, t, pick, clean, disabledDate, TreeSelectRemote, queryParams } from '../../common/Helpers'
import api from '../../common/Api'
import axios from 'axios'
import { connect } from 'react-redux'
import moment from 'moment'
import locale from 'antd/lib/date-picker/locale/ru_RU'
import qs from 'qs'
import SearchSelect from '../../common/Helpers/SearchSelect'
import ReviseStatus from '../../common/ReviseStatus/ReviseStatus'
import Revise from './Revise'
import GetData from './GetData'

const Option = Select.Option
const { RangePicker } = DatePicker

const options = {
  size: 'large',
  getPopupContainer: () => document.getElementById('content'),
}

export const initialFilter = {
  //group: 'action_day',
  'q[created_at][between]': `${moment().subtract(14, "days").startOf('day').unix()},${moment().endOf('day').unix()}`,
}

class _Filter extends Component {

  constructor(props) {
    super(props)
    this.state = {

    }
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      this.props.onSubmit(clean(values))
    })
  }

  validator = (name, label, input) => {
    const { getFieldDecorator } = this.props.form
    const options = { initialValue: Filters.value(name, initialFilter) }
    return (
      <Form.Item className={`filter__field-${name}`}>
        <h4>{label}</h4>
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  render() {
    const { reviseStatuses } = this.props
    return (
      <div className="filter filter__stats">
        <Form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-2">
              {this.validator('created_at', 'Дата', <RangePicker allowClear={false} disabledDate={disabledDate} format="DD.MM.YYYY" {...options} /> )}
              <div className="filter__separator"></div>
              {this.validator('advertiser_id', 'Рекламодатель', <TreeSelectRemote target="/v1/advertisers" {...options}/> )}
            </div>
            <div className="col-md-2">
              {this.validator('lead_id', 'ID конверсии', <Input size="large" /> )}
              <div className="filter__separator"></div>
              {this.validator('hit_id', 'Hit ID', <Input size="large" /> )}
            </div>
            <div className="col-md-2">
              {this.validator('offer_id', 'Оффер', <TreeSelectRemote target="/v1/offers" {...options}/> )}
              <div className="filter__separator"></div>
              {this.validator('revise_status', 'Статус сверки', <ReviseStatus reviseStatuses={reviseStatuses} {...options} /> )}
            </div>
            <div className="col-md-2">
              {this.validator('stream_id', 'Поток', <SearchSelect target="streams" {...options} /> )}
              <div className="filter__separator"></div>
              <Revise />
            </div>
            <div className="col-md-2">
              {this.validator('webmaster_id', 'Пользователь', <SearchSelect target="users" {...options} /> )}
              <div className="filter__separator"></div>
              <GetData reviseStatuses={reviseStatuses} />
            </div>
            <div className="col-md-2">
              <Form.Item>
                <h4>&nbsp;</h4>
                <Button type="primary" htmlType="submit" size="large">{t('button.show')}</Button>
              </Form.Item>
            </div>

          </div>
        </Form>
      </div>
    )
  }
}
export default Form.create()(_Filter)
