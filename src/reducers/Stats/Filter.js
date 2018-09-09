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
const Option = Select.Option
const { RangePicker } = DatePicker

export const initialFilter = {
  group: 'action_day',
  // 'q[created_at][between]': `${moment().subtract(14, "days").startOf('day').utcOffset(Helpers.time_offset()).unix()},${moment().endOf('day').utcOffset(Helpers.time_offset()).unix()}`,
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
    const { form } = this.props
    const values = form.getFieldsValue()
    return (
      <div className="filter block filter__stats">
        <Form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="filter__stats-col">
              {this.validator('created_at', 'Дата', <RangePicker allowClear={false} disabledDate={disabledDate} size="large" format="DD.MM.YYYY" /> )}
              <div className="filter__separator"></div>
              <div className="row">
                <div className="col-md-6">
                  {this.validator('device_type_id', 'Устройства', <TreeSelectRemote filter="devices" /> )}
                </div>
                <div className="col-md-6">
                  {this.validator('stream_id', 'Потоки', <TreeSelectRemote filter="streams" /> )}
                </div>
              </div>
            </div>
            <div className="filter__stats-col">
              {this.validator('group', t('field.group'), (
                <Select size="large" dropdownClassName={'filter__group'} getPopupContainer={Helpers.getPopupContainer}>

                  <Select.Option key="action_month">{t('field.group_action_month')}</Select.Option>
                  <Select.Option key="action_week">{t('field.group_action_week')}</Select.Option>
                  <Select.Option key="action_day">{t('field.group_action_day')}</Select.Option>
                  <Select.Option key="action_hour">{t('field.group_action_hour')}</Select.Option>
                  <Option key="d0" disabled>&nbsp;</Option>
                  <Select.Option key="device_type_id">{t('field.group_device')}</Select.Option>
                  <Select.Option key="platform_id">{t('field.group_platform')}</Select.Option>
                  <Select.Option key="stream_id">{t('field.group_stream')}</Select.Option>
                  <Select.Option key="offer_id">{t('field.group_offer')}</Select.Option>
                  <Select.Option key="landing_id">{t('field.group_landing')}</Select.Option>
                  <Option key="d1" disabled>&nbsp;</Option>
                  <Select.Option key="country_id">{t('field.group_country')}</Select.Option>
                  <Select.Option key="region_id">{t('field.group_region')}</Select.Option>
                  <Select.Option key="city_id">{t('field.group_city')}</Select.Option>
                  <Option key="d2" disabled>&nbsp;</Option>
                  <Select.Option key="sub_id_1_key">{t('field.sub_id_1')}</Select.Option>
                  <Select.Option key="sub_id_2_key">{t('field.sub_id_2')}</Select.Option>
                  <Select.Option key="sub_id_3_key">{t('field.sub_id_3')}</Select.Option>
                  <Select.Option key="sub_id_4_key">{t('field.sub_id_4')}</Select.Option>
                  <Select.Option key="sub_id_5_key">{t('field.sub_id_5')}</Select.Option>
                </Select>
              ))}
              <div className="filter__separator"></div>
              {this.validator('sub_id_1_key', 'Субаккаунты', <TreeSelectRemote placeholder="Sub ID 1" filter="sub_id_1" /> )}
            </div>
            <div className="filter__stats-col">
              {this.validator('offer_id', 'Офферы', <TreeSelectRemote filter="offers" /> )}
              <div className="filter__separator"></div>
              {this.validator('sub_id_2_key', ' ', <TreeSelectRemote placeholder="Sub ID 2" filter="sub_id_2" /> )}
            </div>
            <div className="filter__stats-col">
              {this.validator('action_id', 'Действия', <TreeSelectRemote offer_id={values.offer_id} filter="actions" /> )}
              <div className="filter__separator"></div>
              {this.validator('sub_id_3_key', ' ', <TreeSelectRemote placeholder="Sub ID 3" filter="sub_id_3" /> )}
            </div>
            <div className="filter__stats-col">
              {this.validator('platform_id', 'Источники', <TreeSelectRemote filter="platforms" /> )}
              <div className="filter__separator"></div>
              {this.validator('sub_id_4_key', ' ', <TreeSelectRemote placeholder="Sub ID 4" filter="sub_id_4" /> )}
            </div>
            <div className="filter__stats-col">
              {this.validator('landing_id', 'Лендинги', <TreeSelectRemote filter="landings" /> )}
              <div className="filter__separator"></div>
              {this.validator('sub_id_5_key', ' ', <TreeSelectRemote placeholder="Sub ID 5" filter="sub_id_5" /> )}
            </div>
            <div className="filter__stats-col">
              {this.validator('country_id', 'Страны', <TreeSelectRemote filter="countries" /> )}
              <div className="filter__separator"></div>
            </div>
            <div className="filter__stats-col">
              {this.validator('city_id', 'Города', <TreeSelectRemote target="/v1/cities" /> )}
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
