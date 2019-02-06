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
import _ from 'lodash'
import * as Feather from 'react-feather';
import styles from './Advertisers.module.sass'


const Icons = {}

const Option = Select.Option
const { RangePicker } = DatePicker


const initialFilter = {
  //'q[lead_type][equal]': 'all',
  //'q[created_at][between]': `${moment().subtract(14, "days").startOf('day').utcOffset(Helpers.time_offset()).unix()},${moment().endOf('day').utcOffset(Helpers.time_offset()).unix()}`,
}

class RevisesShort extends Component {

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
          title: 'Название',
          dataIndex: 'title',
          render: (text, row) => <Link to={`/conversions?q[created_at][between]=${row.date_from},${row.date_to}&q[advertiser_id][in]=${row.advertiser_id}`} style={{ display: 'block', minWidth: '200px'}}>{text}</Link>
        },
        {
          title: 'Дата создания',
          dataIndex: 'created_at',
          render: (text, { created_at }) => created_at && moment.unix(created_at).format('DD.MM.YY HH:mm')
        },
        {
          title: 'Скачать',
          dataIndex: 'url',
          render: (text, row) => {
            return text ? <Button href={text} style={{ padding: '5px 10px'}}><Feather.DownloadCloud /></Button> : null
          }
        },
        {
          title: 'Период',
          dataIndex: '',
          render: (text, row) => {
            const { date_from, date_to } = row
            if (!date_from || !date_to) {
              return null
            }
            const fromDate = moment.unix(date_from).format('DD.MM.YYYY')
            const toDate = moment.unix(date_to).format('DD.MM.YYYY')
            return `${fromDate} - ${toDate}`
          }
        },
        {
          title: 'Дней задержки',
          dataIndex: 'overdue',
          render: (text, row) => {
            if (text === null) {
              return null
            }
            if (text === 0) {
              return text
            }
            return Math.ceil(moment.duration(text, 'seconds').asDays())
          },
        },
      ]
    }
  }

  componentDidMount = () => {
    this.fetch()

    api.get('/v1/conversions/statuses')
    .then(response => this.setState({ statuses: response.data }))
  }

  fetch = () => {
    const { filters, pagination } = this.state
    const { advertiser_id } = this.props
    this.setState({ isLoading: true })

    api.get('/v1/hit-action-revises', {
      params: {
        sort: pagination.sort || '-id',
        page: pagination.current || 1,
        ...filters,
        'per-page': pagination.pageSize || 10,
        'q[advertiser_id][equal]': advertiser_id,
        expand: 'overdue',
      }
    })
    .then(response => {
      console.log('hit-action-revises response', response.data);
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

  render() {
    const { data, columns, pagination, isLoading } = this.state
    return (
      <div>
        <h3>Сверки</h3>
        <Table
          ref="tbl"
          className={styles.table}
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

export default RevisesShort
