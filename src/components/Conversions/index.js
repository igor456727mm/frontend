import React, { Component } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Form, Table, Icon, Divider, Select, Input, Button, message, Popconfirm, Tooltip,  DatePicker, Modal, Popover } from 'antd'
import Helpers, { Events, Filters, t, pick, clean, disabledDate, TreeSelectRemote, queryParams } from '../../common/Helpers'
import api from '../../common/Api'
import axios from 'axios'
import { connect } from 'react-redux'
import moment from 'moment'
import locale from 'antd/lib/date-picker/locale/ru_RU'
import qs from 'qs'
import Filter from './Filter'
import _ from 'lodash'
import * as Feather from 'react-feather';


const Icons = {}

const Option = Select.Option
const { RangePicker } = DatePicker

class _Edit extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      isVisible: false,
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.props
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(data && data[name]) {
      options.initialValue = data[name]
    } else if(initialValue) {
      options.initialValue = initialValue
    }

    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, data, action_index_id, selectedActionIndexIds } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)
      values.action_index_ids = action_index_id || selectedActionIndexIds && selectedActionIndexIds.join(',')
      this.setState({ iconLoading: true })
      api.post('/v1/conversions/change-financial-data', qs.stringify(values))
      .then(response => {
        this.setState({ iconLoading: false, isVisible: false })
        Events.dispatch('leads.fetch')
        message.success(t('Конверсия сохранена'))
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        Helpers.errorHandler(e)
      })
    })
  }

  _toggle = () => this.setState({ isVisible: !this.state.isVisible })

  render() {
    const { isVisible, iconLoading } = this.state
    const { action_index_id } = this.props
    return (
      <span>
        <Button onClick={this._toggle}>{action_index_id && <Feather.Settings /> || 'Изменить'}</Button>
        <Modal
          visible={isVisible}
          footer={null}
          onCancel={this._toggle}>
          <h3>{action_index_id && `Конверия #${action_index_id}` || 'Редактирование конверсий'}</h3>
          <Form>
            {this.validator('income', 'Доход вебмастера', <Input size="large" /> )}
            {this.validator('commission', 'Комиссия ПП', <Input size="large" /> )}
            <Form.Item className="form__item-last">
              <Button type="primary" htmlType="submit" size="large" onClick={this.handleSubmit} loading={iconLoading}>{t('button.save')}</Button>
            </Form.Item>
          </Form>
        </Modal>
      </span>
    )
  }

}
const Edit = Form.create()(_Edit)

const initialFilter = {
  'q[lead_type][equal]': 'all',
  'q[created_at][between]': `${moment().subtract(14, "days").startOf('day').utcOffset(Helpers.time_offset()).unix()},${moment().endOf('day').utcOffset(Helpers.time_offset()).unix()}`,
}

class Leads extends Component {

  constructor(props) {
    super(props)
    const tmp = Filters.parse()
    this.state = {
      data: [],
      filters: (_.isEmpty(tmp) && { ...initialFilter }) || tmp,
      types: {},
      statuses: {},
      pagination: {
        hideOnSinglePage: true,
      },
      selectedRowKeys: [],
      selectedActionIndexIds: [],
      columns: [
        {
          title: 'Дата создания',
          dataIndex: 'created_at',
          sorter: true,
          width: 150,
          render: (text, { created_at }) => created_at && moment.unix(created_at).format('DD.MM.YY HH:mm')
        }, {
          title: 'Оффер',
          dataIndex: 'offer_id',
          render: (text, row) => text && <a href={`/offers/${row.offer.id}`} target="_blank" style={{ width: '200px', display: 'inline-block' }}>{row.offer.name}</a> || '-'
        }, {
          title: 'Рекламодатель',
          render: (text, row) => row.offer && row.offer.advertiser && row.offer.advertiser.name || '-'
        }, {
          title: 'ГЕО',
          render: (text, { country, ip }) => <div>{country && country.name}<br />{ip}</div>
        }, {
          title: 'Девайс',
          dataIndex: 'device',
        }, {
          title: 'Статус',
          dataIndex: 'status',
          render: (text) => this.state.statuses[text] || text,
        }, {
          title: 'Доход веба',
          dataIndex: 'income',
          render: (text) => `${text}$`
        }, {
          title: 'Комиссия ПП',
          dataIndex: 'commission',
          render: (text) => `${text}$`
        }, {
          title: 'Доход из сверки',
          dataIndex: 'revised_income',
          render: (text) => `${text}$`
        }, {
          title: 'Разница',
          render: (text, row) => (row.revised_income - (row.income + row.commission)) + '$'
        }, {
          title: 'Статус сверки',
          dataIndex: 'revise_status',
        }, {
          title: 'Цель',
          dataIndex: 'action.name',
        }, {
          title: 'Поток',
          dataIndex: 'stream_id',
        }, {
          title: 'Вебмастер',
          dataIndex: 'webmaster_id',
          render: (text, row) => row.webmaster && <a href={`/users/${text}`}>{row.webmaster.email}</a> || text
        }, {
          title: 'Sub1',
          dataIndex: 'sub_id_1'
        }, {
          title: 'Sub2',
          dataIndex: 'sub_id_2'
        }, {
          title: 'Sub3',
          dataIndex: 'sub_id_3'
        }, {
          title: 'ID конверсии',
          dataIndex: 'lead_id',
        }, {
          title: 'Hit ID',
          dataIndex: 'hit_id',
        }, {
          width: 220,
          render: (text, { action_index_id, end_hold_time, status, ...row }, index ) => {
            // можно удалять все, кроме конверсии с истекщим сроком холда.
            const disabled = end_hold_time === null ? false : (end_hold_time < moment().unix()) || false
            return (
              <div className="leads__table-actions">
                <Edit action_index_id={action_index_id} data={{ income: row.income, commission: row.commission }} />
                <Button disabled={disabled || status === 'confirmed'} onClick={() => this._onConfirm(action_index_id, index)} style={{ margin: '0 10px'}}><Feather.CheckCircle /></Button>
                <Button disabled={disabled || status === 'rejected'} onClick={() => this._onReject(action_index_id, index)} style={{ marginRight: '10px' }}><Feather.XCircle /></Button>
                <Button disabled={disabled} onClick={() => this._onDelete(action_index_id, index)}><Feather.Trash /></Button>
              </div>
            )
          }
        }
      ]
    }
  }

  componentDidMount = () => {
    this.fetch()
    Events.follow('leads.fetch', this.fetch)

    api.get('/v1/conversions/statuses')
    .then(response => this.setState({ statuses: response.data }))
  }

  componentWillUnmount = () => {
    Events.unfollow('leads.fetch', this.fetch)
  }

  fetch = () => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })

    api.get('/v1/conversions', {
      params: {
        sort: pagination.sort || '-id',
        page: pagination.current || 1,
        ...filters,
        'per-page': pagination.pageSize,
        currency_id: 1,
        expand: 'stream,action,city,country,currency,offer,device,platform,webmaster,user,offer.advertiser',
      }
    })
    .then(response => {
      pagination.total = parseInt(response.headers['x-pagination-total-count'])
      this.setState({
        isLoading: false,
        data: response.data,
        pagination
      })
      Filters.toUrl(filters)
    })
  }

  handleTableChange = ({ current: page }, filters, { columnKey, order }) => {
    const sort = order == 'ascend' ? columnKey : `-${columnKey}`
    const pagination = { ...this.state.pagination, current: page, sort: sort }
    this.setState({ pagination }, this.fetch)
  }

  onFilter = (values) => {
    const filters = Filters.prepare(values)
    /* const group = values.group
    filters.group = group
    // filters.sort = `-${group}`
    if(group.includes('sub_id_')) {
      filters['expand'] = group.replace(`_key`, '')
    } else if(group == 'device_type_id') {
       filters['expand'] = 'device'
    } else {
      filters['expand'] = group.replace('_id', '')
    } */
    this.setState({ filters }, this.fetch)
  }

  renderCurrencyCell = (count, sum, type, row) => {
    const tmp = []
    const keys = Object.keys(count)
    if(keys.length == 0) return `-`
    keys.forEach(currency_id => {
      if(count[currency_id] == 0 && sum[currency_id] == 0) return
      const currency = Helpers.renderCurrency(currency_id)
      tmp.push(<div className="stats__table-leads" onClick={() => this.openLeads(type, currency_id, row)} key={currency_id}>{count[currency_id]} / {sum[currency_id]} {currency}</div>)
    })
    if(tmp.length == 0) return `-`
    return tmp
  }

  onSelectChange = (selectedRowKeys, rows) => {
    const selectedActionIndexIds = rows.map(row => row.action_index_id)
    this.setState({ selectedRowKeys, selectedActionIndexIds })
    console.log('selectedActionIndexIds', selectedActionIndexIds);
  }

  _onConfirm = (id, index) => {
    const { data } = this.state
    data[index].status = 'confirmed'
    this.setState({ data })
    api.post('/v1/conversions/confirm', qs.stringify({ action_index_ids: id }))
    .catch(Helpers.errorHandler)
  }

  _onMultipleConfirm = () => {
    const { selectedActionIndexIds: ids } = this.state
    api.post('/v1/conversions/confirm', qs.stringify({ action_index_ids: ids.join(',') }))
    .then(response => {
      this.fetch()
      this.setState({ selectedActionIndexIds: [], selectedRowKeys: [] })
    })
    .catch(Helpers.errorHandler)
  }

  _onReject = (id, index) => {
    const { data } = this.state
    data[index].status = 'rejected'
    this.setState({ data })
    api.post('/v1/conversions/reject', qs.stringify({ action_index_ids: id }))
    .catch(Helpers.errorHandler)
  }

  _onMultipleReject = () => {
    const { selectedActionIndexIds: ids } = this.state
    api.post('/v1/conversions/reject', qs.stringify({ action_index_ids: ids.join(',') }))
    .then(response => {
      this.fetch()
      this.setState({ selectedActionIndexIds: [], selectedRowKeys: [] })
    })
    .catch(Helpers.errorHandler)
  }

  _onDelete = (id, index) => {
    api.delete(`/v1/conversions/${id}`)
    .then(response => {
      const { data } = this.state
      data.splice(index, 1);
      this.setState({ data })
    })
    .catch(Helpers.errorHandler)
  }

  render() {
    const { data, columns, pagination, isLoading, selectedRowKeys, selectedActionIndexIds } = this.state
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };
    const hasSelected = selectedRowKeys.length > 0;
    return (
      <div>
        <Filter type="leads" initialFilter={initialFilter} types={this.state.types} onSubmit={this.onFilter} />
        <Table
          ref="tbl"
          rowSelection={rowSelection}
          className="stats__table stats__table-leads"
          columns={columns}
          rowKey={(item, i) => i}
          dataSource={data}
          pagination={pagination}
          loading={isLoading}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange} />

          <div className="stats__table-leads-btns">
            <Edit selectedActionIndexIds={selectedActionIndexIds} data={{ income: 0, commission: 0 }} />
            <Button onClick={this._onMultipleConfirm}>Принять</Button>
            <Button onClick={this._onMultipleReject}>Отклонить</Button>
          </div>


      </div>
    )
  }
}

export default connect((state) => pick(state, 'user'))(Form.create()(Leads))
