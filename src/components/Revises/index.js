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


const initialFilter = {
  //'q[lead_type][equal]': 'all',
  //'q[created_at][between]': `${moment().subtract(14, "days").startOf('day').utcOffset(Helpers.time_offset()).unix()},${moment().endOf('day').utcOffset(Helpers.time_offset()).unix()}`,
}

class Revises extends Component {

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
          title: 'ID',
          dataIndex: 'id',
          sorter: true,
        }, {
          title: 'Скачать',
          dataIndex: 'url',
          render: (text, row) => {
            return text ? <Button href={text} style={{ padding: '5px 10px'}}><Feather.DownloadCloud /></Button> : null
          }
        }, {
          title: 'Название',
          dataIndex: 'title',
          sorter: true,
          render: (text, row) => <Link to={`/conversions?q[created_at][between]=${row.date_from},${row.date_to}&q[advertiser_id][in]=${row.advertiser_id}`} style={{ display: 'block', minWidth: '200px'}}>{text}</Link>
        }, {
          title: 'Дата создания',
          dataIndex: 'created_at',
          sorter: true,
          width: 150,
          render: (text, { created_at }) => created_at && moment.unix(created_at).format('DD.MM.YY HH:mm')
        }, {
          title: 'Тип',
          dataIndex: 'type',
        }, {
          title: 'Депов в сверке',
          dataIndex: 'lead_count_revise'
        }, {
          title: 'Депов в системе',
          dataIndex: 'lead_count_system'
        }, {
          title: 'Разница',
          dataIndex: 'lead_count_diff'
        }, {
          title: 'Принято',
          dataIndex: 'count_confirmed'
        }, {
          title: 'Принято с корректировкой',
          dataIndex: 'count_corrected'
        }, {
          title: 'Холд',
          dataIndex: 'count_hold'
        }, {
          title: 'Отклонено',
          dataIndex: 'count_rejected'
        }, {
          title: 'Ожидает корректировки',
          dataIndex: 'count_waiting'
        }, {
          title: 'Доход ПП',
          dataIndex: 'pp_income',
          render: (text) => `${text || 0}$`
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

    api.get('/v1/hit-action-revises', {
      params: {
        sort: pagination.sort || '-id',
        page: pagination.current || 1,
        ...filters,
        'per-page': pagination.pageSize,
        //currency_id: 1,
        //expand: 'stream,action,city,country,currency,offer,device,platform,webmaster,user,offer.advertiser',
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
    const sort = (order && columnKey) && (order == 'ascend' ? columnKey : `-${columnKey}`)
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

  render() {
    const { data, columns, pagination, isLoading } = this.state
    return (
      <div>
        <Filter initialFilter={initialFilter} onSubmit={this.onFilter} />
        <Table
          ref="tbl"
          className="stats__table stats__table-leads"
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

export default Revises
