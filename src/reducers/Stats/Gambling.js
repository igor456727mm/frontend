import React, { Component } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Form, Table, Icon, Divider, Select, Input, Button, message, Popconfirm, Tooltip,  DatePicker, Modal } from 'antd'
import Helpers, { Events, Filters, t, pick, clean, disabledDate, TreeSelectRemote, queryParams } from '../../common/Helpers'
import api from '../../common/Api'
import axios from 'axios'
import { connect } from 'react-redux'
import moment from 'moment'
import locale from 'antd/lib/date-picker/locale/ru_RU'
import qs from 'qs'

import Filter, { initialFilter } from './Filter'

const Option = Select.Option
const { RangePicker } = DatePicker



class Stats extends Component {

  constructor(props) {
    super(props)
    const tmp = Filters.parse()
    this.state = {
      data: [],
      filters: Object.keys(tmp).length && tmp || initialFilter,
      pagination: {
        hideOnSinglePage: true,
      },
    }
  }

  handleTableChange = ({ current: page }, filters, { columnKey, order }) => {
    const sort = order == 'ascend' ? columnKey : `-${columnKey}`
    const pagination = { ...this.state.pagination, current: page, sort: sort }
    this.setState({ pagination }, this.fetch)
  }

  componentDidMount = () => {
    this.fetch()
    Events.follow('stats.fetch', this.fetch)
  }

  componentWillUnmount = () => {
    Events.unfollow('stats.fetch', this.fetch)
  }

  fetch = () => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })

    // 24 perpage on action_hour
    pagination.pageSize = 11
    if(filters.group == 'action_hour') pagination.pageSize = 25

    const request = api.get('/v1/statistics', {
      params: {
        sort: pagination.sort || `-${filters.group}`,
        page: pagination.current || 1,
        ...filters,
        'per-page': pagination.pageSize - 1,
        currency_id: this.props.user.currency_id,
        'q[offer_type][equal]': 2,
      }
    })

    const total = api.get('/v1/statistics', {
      params: {
        ...filters,
        group: 'all',
        expand: false,
        'q[offer_type][equal]': 2,
      }
    })

    axios.all([request, total])
    .then(axios.spread((response, total) => {
      const data = response.data
      if(total.data && total.data[0]) data.push(total.data[0])
      pagination.total = parseInt(response.headers['x-pagination-total-count'])
      this.setState({
        isLoading: false,
        data: response.data,
        pagination
      })
      Filters.toUrl(filters)
    }))
  }

  onFilter = (values) => {
    const filters = Filters.prepare(values)
    const group = values.group
    filters.group = group
    // filters.sort = `-${group}`
    if(group.includes('sub_id_')) {
      filters['expand'] = group.replace(`_key`, '')
    } else if(group == 'device_type_id') {
       filters['expand'] = 'device'
    } else {
      filters['expand'] = group.replace('_id', '')
    }
    this.setState({ filters }, this.fetch)
  }

  renderFirstColumn = () => {
    const { data, filters, pagination, devices } = this.state
    const group = filters['group']
    const title = group.includes(`sub_id_`) && group.replace(`_key`, '') || group.replace('_id', '')

    // костыль для "правильной" сортировки в таблице
    const tmp = {}
    const sortOrder = pagination.sort && pagination.sort.includes(group) && (pagination.sort.charAt(0) == '-' ? 'descend' : 'ascend' ) || !pagination.sort && `descend`
    if(sortOrder) tmp.sortOrder = sortOrder
    return {
      title: t(`field.${title}`),
      dataIndex: group,
      sorter: true,
      ...tmp,
      defaultSortOrder: 'descend',
      render: (text, row, i) => {
        if(data.length - 1 == i) return t('field.total')
        switch(group) {
          case 'offer_id':
            text = row.offer && <span><a href={`/offers/${row.offer.id}`} target="_blank">{row.offer.name}</a></span> || '-'
            break;
          case 'country_id':
            text = row.country && <span>{row.country.name}</span>
            break;
          case 'device_type_id':
            text = <span>{row.device}</span> || '-'
            break;
          case 'platform_id':
            text = row.platform && <span>{row.platform.name}</span> || '-'
            break;
          case 'landing_id':
            text = '-'
            break;
          case 'stream_id':
            text = row.stream && <span>{row.stream.name}</span> || '-'
            break;
          case 'action_day':
            text = row[group] && moment.unix(row[group]).format('DD.MM.YY')
            break;
          case 'action_month':
            text = row[group] && moment.unix(row[group]).format('MMMM YYYY')
            break;
          case 'action_week':
            const start = moment.unix(row[group])
            const end = moment.unix(row[group]).add(7, 'days')
            text = `${start.format('DD.MM.YY')} - ${end.format('DD.MM.YY')} `
            break;
          case 'action_hour':
            const hour = row[group] < 10 ? `0${row[group]}` : row[group]
            let nextHour = row[group] < 10 ? `0${row[group]+1}` : row[group]+1
            if(nextHour == 24) nextHour = '00'
            text = hour && `${hour}:00 - ${nextHour}:00` || '-'
            break;
          case 'sub_id_1_key':
          case 'sub_id_2_key':
          case 'sub_id_3_key':
          case 'sub_id_4_key':
          case 'sub_id_5_key':
            const key = group.replace(`_key`, '')
            text = (typeof row[key] == 'object') && row[key] && row[key].name || '-'
            break;
        }

        return text
      }
    }
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

  openLeads = (type, currency_id, row) => {
    const { filters } = this.state
    const value = row[filters.group]

    window.store.dispatch({
      type: 'STATS_LEADS_OPEN',
      params: {
        isVisible: true,
        type,
        currency_id,
        filters,
        'q[offer_type][equal]': 2,
        value: value,
      }
    })
  }

  render() {
    const { data, pagination, isLoading } = this.state
    const columns = [
      this.renderFirstColumn(),
      {
        title: (<div className="stats__table-th-title">Трафик  <div>Переходы / Уники</div></div>),
        dataIndex: 'hit_count',
        render: (text, { hit_count, click_count }) =>   `${hit_count} / ${click_count}`,
        sorter: true,
      }, {
        title: 'TrafBack',
        dataIndex: 'traffic_back',
        sorter: true
      }, {
        title: 'Регистрации',
        dataIndex: 'reg_count',
        sorter: true
      }, {
        title: (<div className="stats__table-th-title">First dep  <div>Кол-во / {t('field.sum')}</div></div>),
        dataIndex: 'first_dep_count',
        render: (text, { first_dep_count: count, first_dep_sum: sum }) => `${count} / ${sum} $`,
        sorter: true,
      }, {
        title: (<div className="stats__table-th-title">Dep <div>Кол-во / {t('field.sum')}</div></div>),
        dataIndex: 'dep_count',
        render: (text, { dep_count: count, dep_sum: sum }) => `${count} / ${sum} $`,
        sorter: true,
      }, {
        title: (<div className="stats__table-th-title">CPA <div>Лиды / {t('field.sum')}</div></div>),
        dataIndex: 'cpa_confirmed_leads_count',
        render: (text, row) => {
          const { cpa_confirmed_leads_count: count, cpa_confirmed_income_sum: sum } = row
          return this.renderCurrencyCell(count, sum, 'confirmed', row)
        },
        sorter: true,
      }, {
        title: 'Revshare',
        dataIndex: 'revshare_income',
        render: (text, { revshare_income: count }) => {
          const tmp = []
          const keys = Object.keys(count)
          if(keys.length == 0) return `-`
          keys.forEach(currency_id => {
            const currency = Helpers.renderCurrency(currency_id)
            tmp.push(<div key={currency_id}>{count[currency_id]} {currency}</div>)
          })
          return tmp
        },
        sorter: true,
      }, {
        title: 'EPC',
        dataIndex: 'epc',
        render: text => {
          const currency = Helpers.renderCurrency(this.props.user.currency_id)
          return `${text} ${currency}`
        },
        sorter: true
      }, {
        title: 'CR',
        dataIndex: 'cpa_cr',
        render: text => `${text}%`,
        sorter: true
      },
    ]

    return (
      <div>
        <Filter onSubmit={this.onFilter} />
        <Table
          ref="tbl"
          className="stats__table"
          columns={columns}
          rowKey={(item, i) => i}
          dataSource={data}
          pagination={pagination}
          loading={Helpers.spinner('table', isLoading)}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange} />
      </div>
    )
  }
}

export default connect((state) => pick(state, 'user'))(Form.create()(Stats))
