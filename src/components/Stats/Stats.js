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
    // console.log('handleTableChange', page, columnKey, order);
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

  //  console.log('fetch', filters, pagination);

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
      }
    })

    const total = api.get('/v1/statistics', {
      params: {
        ...filters,
        group: 'all',
        expand: false,
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
    const { data, filters, pagination, devices, isLoading } = this.state
    const group = filters['group']
    const title = group.includes(`sub_id_`) && group.replace(`_key`, '') || group.replace('_id', '')

    // console.log('renderFirstColumn', pagination);

    // костыль для "правильной" сортировки в таблице
    /* const tmp = {}
    const sortOrder = pagination.sort && pagination.sort.includes(group) && (pagination.sort.charAt(0) == '-' ? 'descend' : 'ascend' ) || !pagination.sort && `descend`
    if(sortOrder) tmp.sortOrder = sortOrder */
    return {
      title: t(`field.${title}`),
      dataIndex: group,
      sorter: true,
      // ...tmp,
      defaultSortOrder: 'descend',
      render: (text, row, i) => {
        if(data.length - 1 == i) return t('field.total')
        switch(group) {
          case 'webmaster_id':
            text = row.webmaster && <span><a href={`/users/${row.webmaster.id}`} target="_blank">{row.webmaster.login}</a></span> || '-'
            break;
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
            text = hour && `${hour}:00` || '-'
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

        if(isLoading) return '...'

        return text
      }
    }
  }

  renderCurrencyCell = (count, sum) => {
    const tmp = []
    const keys = Object.keys(count)
    if(keys.length == 0) return `-`
    keys.forEach(currency_id => {
      const currency = '$'
      tmp.push(<div key={currency_id}>{count[currency_id]} / {sum[currency_id]} {currency}</div>)
    })
    return tmp
  }

  render() {
    const { data, pagination, isLoading } = this.state
    const columns = [
      this.renderFirstColumn(),
      {
        title: t('field.hit_count'),
        dataIndex: 'hit_count',
        sorter: true
      }, {
        title: t('field.click_count'),
        dataIndex: 'click_count',
        sorter: true
      }, {
        title: 'Рег',
        dataIndex: 'reg_count',
        sorter: true
      }, {
        title: (<div className="stats__table-th-title">First dep<div>{t('field.count')} / {t('field.sum')}</div></div>),
        dataIndex: 'first_dep_count',
        render: (text, { first_dep_count, first_dep_sum }) => `${first_dep_count} / ${first_dep_sum}`,
        sorter: true,
      }, {
        title: (<div className="stats__table-th-title">Dep<div>{t('field.count')} / {t('field.sum')}</div></div>),
        dataIndex: 'dep_count',
        render: (text, { dep_count, dep_sum }) => `${dep_count} / ${dep_sum}`,
        sorter: true,
      }, /* {
        title: t('field.player_lose'),
        dataIndex: 'player_lose_sum',
        sorter: true,
      }, {
        title: t('field.player_out'),
        dataIndex: 'player_out_sum',
        sorter: true,
      }, */
      {
        title: (<div className="stats__table-th-title">Активность<div>{t('field.player_lose')} / {t('field.player_out')}</div></div>),
        dataIndex: 'player_lose_sum',
        render: (text, { player_lose_sum, player_out_sum }) => `${player_lose_sum} / ${player_out_sum}`,
        sorter: true,
      }, {
        title: t('field.player_promo'),
        dataIndex: 'player_promo_sum',
        sorter: true,
      }, {
        title: 'Net gaming',
        dataIndex: 'net_gaming',
        sorter: true,
      }, {
        title: 'CPA',
        dataIndex: 'cpa_confirmed_income_sum',
        sorter: true,
      }, {
        title: 'Revshare',
        dataIndex: 'revshare_income',
        sorter: true
      }, {
        title: (<div className="stats__table-th-title">Доход<div>CPA / Revshare</div></div>),
        dataIndex: 'cpa_confirmed_commission',
        render: (text, { cpa_confirmed_commission: cpa, revshare_commission: revshare }) => `${cpa || 0} $ / ${revshare || 0} $`,
        sorter: true,
      }
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
          loading={isLoading}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange} />
      </div>
    )
  }
}

export default connect((state) => pick(state, 'user', 'config'))(Form.create()(Stats))
