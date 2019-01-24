import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import qs from 'qs'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import Helpers, { t, pick, queryParams, parseQueryFiltersValues, disabledDate, Events } from '../../../common/Helpers'
import api from '../../../common/Api'
import SearchSelect from '../../../common/Helpers/SearchSelect'
import ChangingText from '../../../common/ChangingText/ChangingText'

class Withdrawals extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      filters: queryParams(),
      pagination: {
        hideOnSinglePage: true,
      },
      statuses: {},
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
          sorter: true,
        }, {
          title: 'Дата',
          dataIndex: 'created_at',
          render: text => moment.unix(text).format('DD.MM.YYYY (HH:mm)'),
          sorter: true,
        }, {
          title: 'Сумма',
          dataIndex: 'sum',
          render: (text, row) => {
            const currency ='$'
            return `${text} ${currency}`
          },
          sorter: true,
        }, {
          title: 'Статус',
          dataIndex: 'status',
          //render: text => Helpers.renderStatus(text, this.state.statuses),
          render: (text, row) => {
            const { statuses } = this.state
            if(row.status !== 'pending') return Helpers.renderStatus(text, statuses)
            return (
              <select name="status" defaultValue={row.status}>
                {Object.keys(statuses).map(key => <option value={key} key={key}>{statuses[key]}</option>)}
              </select>
            )
          },
          sorter: true,
        }, {
          title: 'Кошелек',
          dataIndex: 'wallet.name',
          sorter: true,
          render: (text, row) => {
            const number = row.wallet && row.wallet.data && row.wallet.data.number
            return number ? `${text} / ${number}` : text
          }
        }, {
          title: 'Комментарий',
          dataIndex: 'comment',
          render: (text, row) => {
            if(row.status !== 'pending') {
              return <ChangingText onTextEdit={this.onTextEdit(row.id, 'comment')} text={text}/>
            }
            return (
              <input name="comment" className="ant-input" placeholder="Комментарий" defaultValue={text} />
            )
          }
        }, {
          title: 'Комментарий вебу',
          dataIndex: 'webmaster_comment',
          render: (text, row) => {
            if(row.status !== 'pending') {
              return <ChangingText onTextEdit={this.onTextEdit(row.id, 'webmaster_comment')} text={text}/>
            }
            // if(row.status !== 'pending') return text
            return (
              <input name="webmaster_comment" className="ant-input" placeholder="Комментарий вебу" defaultValue={text} />
            )
            // return (
            //   <input name="webmaster_comment" className="ant-input" placeholder="Комментарий вебу" defaultValue={text} />
            // )
          }
        }, {
          width: 280,
          render: (text, row) => {
            /*
            <span><Button onClick={() => this._onConfirmed(row.id)}>Подтвердить</Button></span>
            <span><Button type="danger" onClick={() => this._onRejected(row.id)}>X</Button></span>
            */
            if(row.status !== 'pending') return null
            return (
              <div className="table__actions">
                <span><Button onClick={(e) => this._onSave(row.id, e)}>Сохранить</Button></span>
              </div>
            )
          }
        }
      ]
    }
  }

  handleTableChange = ({ current }, filters, { columnKey, order }) => {
    this.setState({
      pagination: {
        ...this.state.pagination,
        current: current,
      }
    })
    this.fetch(current, {
      sort: (order && columnKey) && (order == 'ascend' ? columnKey : `-${columnKey}`)
    })
  }

  componentDidMount = () => {
    this.fetch()

    Events.follow('withdrawals.fetch', this.fetch)

    api.get('/v1/withdrawals/statuses')
    .then(response => {
      this.setState({ statuses: response.data })
    })
  }

  fetch = (page = 1, options = {}) => {
    const { filters, columns } = this.state
    if(!options.sort) options.sort = `-${columns[0].dataIndex}`
    this.setState({ isLoading: true })
    api.get('/v1/withdrawals', {
      params: {
        page: page,
        expand: 'wallet,user',
        'q[user_id][equal]': this.props.user_id,
        ...filters,
        ...options
      }
    })
    .then(response => {
      this.setState({
        isLoading: false,
        data: response.data,
        pagination: {
          ...this.state.pagination,
          total: parseInt(response.headers['x-pagination-total-count'])
        }
      })
    })
  }

  _onConfirmed = (id) => {
    api.patch(`/v1/withdrawals/${id}`, qs.stringify({ status: 'confirmed', currency_id: 1 }))
    .then(response => {
      message.success(`Выплата подтверждена`)
      this.fetch()
    })
    .catch(Helpers.errorHandler)
  }

  _onRejected = (id) => {
    api.patch(`/v1/withdrawals/${id}`, qs.stringify({ status: 'rejected', currency_id: 1 }))
    .then(response => {
      this.fetch()
    })
    .catch(Helpers.errorHandler)
  }

  _onSave = (id, e) => {
    const row = e.target.closest("tr")
    const status = row.childNodes[3].children[0].value
    const comment = row.childNodes[5].children[0].value
    const webmaster_comment = row.childNodes[6].children[0].value

    if(status === 'pending' && !comment) {
      message.error('Не указан статус или комментарий')
      return
    }

    api.patch(`/v1/withdrawals/${id}`, qs.stringify({ status, comment, webmaster_comment, currency_id: 1 }))
    .then(response => {
      this.fetch()
      Events.dispatch('user.fetch')
    })
    .catch(Helpers.errorHandler)
  }

  onTextEdit = (id, field) => text => {
    if(!text) {
      message.error('Введите комментарий')
      return
    }

    api.patch(`/v1/withdrawals/${id}`, qs.stringify({ [field]: text }))
    .then(response => {
      message.success(`Комментарий изменен`)
      this.fetch()
    })
    .catch(Helpers.errorHandler)
  }

  render() {
    const { data, columns, pagination, statuses, isLoading } = this.state
    return (
      <div style={{ marginTop: '50px' }}>
        <h2>Выплаты</h2>
        <Table
          className="app__table"
          columns={columns}
          rowKey={item => item.id}
          dataSource={data}
          pagination={pagination}
          loading={isLoading}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange} />
      </div>
    )
  }
}

export default Withdrawals
