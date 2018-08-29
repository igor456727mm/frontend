import React, { Component } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Form, Table, Icon, Divider, Select, Input, Button, message, Popconfirm, Tooltip,  DatePicker, Modal } from 'antd'
import Helpers, { Filters, t, pick, clean, disabledDate, TreeSelectRemote, queryParams } from '../../common/Helpers'
import api from '../../common/Api'
import axios from 'axios'
import { connect } from 'react-redux'
import moment from 'moment'
import locale from 'antd/lib/date-picker/locale/ru_RU'
import qs from 'qs'
import SearchSelect from '../../common/Helpers/SearchSelect'


const Option = Select.Option
const { RangePicker } = DatePicker

const options = {
  size: 'large',
  getPopupContainer: () => document.getElementById('content'),
}

export const initialFilter = {
  group: 'action_day',
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
      console.log('submit', values);
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

  /*
  <div className="row">
    <div className="col-md-6">
      {this.validator('device_type_id', 'Устройства', <TreeSelectRemote filter="devices" /> )}
    </div>
    <div className="col-md-6">
      {this.validator('stream_id', 'Потоки', <TreeSelectRemote filter="streams" /> )}
    </div>
  </div>

  */

  render() {
    return (
      <div className="filter filter__stats">
        <Form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-2">
              {this.validator('group', t('field.group'), (
                <Select {...options}>
                  <Select.Option key="action_hour">{t('field.action_hour')}</Select.Option>
                  <Select.Option key="action_day">{t('field.action_day')}</Select.Option>
                  <Select.Option key="action_week">{t('field.action_week')}</Select.Option>
                  <Select.Option key="action_month">{t('field.action_month')}</Select.Option>
                  <Select.Option key="webmaster_id">{t('field.webmaster_id')}</Select.Option>
                  <Select.Option key="offer_id">{t('field.offer')}</Select.Option>
                  <Select.Option key="country_id">{t('field.country')}</Select.Option>
                  <Select.Option key="device_type_id">{t('field.device')}</Select.Option>
                  <Select.Option key="platform_id">{t('field.platform')}</Select.Option>
                  <Select.Option key="stream_id">{t('field.stream')}</Select.Option>
                  <Select.Option key="landing_id">{t('field.landing')}</Select.Option>
                </Select>
              ))}
              <div className="filter__separator"></div>
              {this.validator('created_at', 'Дата', <RangePicker allowClear={false} disabledDate={disabledDate} format="DD.MM.YYYY" {...options} /> )}
            </div>
            <div className="col-md-2">
              {this.validator('offer_id', 'Оффер', <TreeSelectRemote target="/v1/offers" {...options}/> )}
              <div className="filter__separator"></div>
              {this.validator('landing_id', 'Лендинг', <TreeSelectRemote filter="landings" {...options}/> )}
            </div>
            <div className="col-md-2">
              {this.validator('platform_id', 'Площадка', <TreeSelectRemote filter="platforms" {...options} /> )}
              <div className="filter__separator"></div>
              {this.validator('stream_id', 'Поток', <TreeSelectRemote filter="streams" {...options} /> )}
            </div>
            <div className="col-md-2">
              {this.validator('sub_id_1_key', 'sub_id_1', <TreeSelectRemote filter="sub_id_1" {...options} /> )}
              <div className="filter__separator"></div>
              {this.validator('country_id', 'Страны', <TreeSelectRemote filter="countries" {...options} /> )}
            </div>
            <div className="col-md-2">
              {this.validator('sub_id_2_key', 'sub_id_2', <TreeSelectRemote filter="sub_id_2" {...options} /> )}
              <div className="filter__separator"></div>
              {this.validator('webmaster_id', 'Пользователь', <SearchSelect target="/v1/users" {...options} /> )}
            </div>
            <div className="col-md-2">
              {this.validator('sub_id_3_key', 'sub_id_3', <TreeSelectRemote filter="sub_id_3" {...options} /> )}
              <div className="filter__separator"></div>
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
