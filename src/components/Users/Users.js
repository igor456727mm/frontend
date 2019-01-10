import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import qs from 'qs'
import * as Cookies from 'js-cookie'
import { Link } from 'react-router-dom'
import Helpers, { Filters, t, pick, clean, disabledDate } from '../../common/Helpers'
import api from '../../common/Api'
import { domain, scheme } from '../../config'
import ChangingManager from '../../common/ChangingManager'
import * as Manager from '../../common/Helpers/ManagerSelect'

const Icons = {}

export class Login extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
    }
  }

  _getAccess = () => {
    const { user_id } = this.props
    this.setState({ isLoading: true })
    api.post(`/v1/users/${user_id}/generate-access-token`)
    .then(response => {
      const params = { expires: 1 / 24, domain: `.${domain}` }

      Cookies.set('access_token', response.data.access_token, params)
      Cookies.set('refresh_token', 1, params)
      Cookies.set('user_id', user_id, params)
      Cookies.set('isManager', 1, params)

      this.setState({ isLoading: false })
      window.open(`${scheme}my.${domain}`, '_blank')
    })
    .catch(e => {
      this.setState({ isLoading: false })
      Helpers.errorHandler(e)
    })
  }

  render() {
    const { isLoading } = this.state
    return (
      <Button onClick={this._getAccess}>{isLoading && Helpers.spinner()} Войти</Button>
    )
  }
}


class _Filter extends Component {

  constructor(props) {
    super(props)
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      this.props.onSubmit(clean(values))
    })
  }

  validator = (name, label, input) => {
    const { getFieldDecorator } = this.props.form
    const options = { initialValue: Filters.value(name) }
    return (
      <Form.Item className={`filter__field-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  render() {
    const { statuses } = this.props
    const _statuses = Object.keys(statuses).map(item => <Select.Option key={item} value={item}>{statuses[item]}</Select.Option>)
    return (
      <div className="filter filter__users">
        <Form>
          {this.validator('created_at', t('field.date'), <DatePicker.RangePicker disabledDate={disabledDate} size="large" format="DD.MM.YYYY"  /> )}
          {this.validator('login', t('field.login'), <Input size="large" /> )}
          {this.validator('email', t('field.email'), <Input size="large" /> )}
          {this.validator('status', t('field.status'), <Select placeholder={t('field.all')} size="large" allowClear>{_statuses}</Select> )}
          <Form.Item>
            <h4>&nbsp;</h4>
            <Button onClick={this.handleSubmit} type="primary" htmlType="submit" size="large">{t('button.show')}</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = Form.create()(_Filter)

class Users extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      statuses: {},
      filters: Filters.parse(),
      data: [],
      users: [],
      personalManagers: [],
      pagination: {
        hideOnSinglePage: true,
        pageSize: 25,
      },
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
          sorter: true,
          defaultSortOrder: 'descend',
        }, {
          title: 'Дата создания',
          dataIndex: 'created_at',
          render: text => moment.unix(text).format('DD.MM.YYYY HH:mm'),
          sorter: true,
        }, {
          title: 'Логин',
          dataIndex: 'login',
          sorter: true,
          render: (text, row) => <Link to={`/users/${row.id}`} className="link">{text}</Link>
        }, {
          title: 'Email',
          dataIndex: 'email',
          sorter: true,
        }, {
          title: 'Статус',
          dataIndex: 'status',
          render: text => Helpers.renderStatus(text, this.state.statuses),
          sorter: true,
        }, {
          title: 'Персональный менеджер',
          dataIndex: '',
          render: (text, row) => {
            // console.log('row', row);
            return row.personalManager &&
            <ChangingManager
              managerType="personalManager"
              user_id ={row.id}
              name={row.personalManager.name}
              id={row.personalManager.id}
              managers={this.state.personalManagers}
            /> || null
            // return row.personalManager && row.personalManager.name || null
          },
        }, {
          title: 'Кол-во рефералов',
          dataIndex: '',
          render: (text, row) => {
            return row.referralStat && row.referralStat.usersCount || null
          },
        }, {
          title: 'Кол-во активных рефералов',
          dataIndex: '',
          render: (text, row) => {
            return row.referralStat && row.referralStat.activeUsersCount || null
          },
        }, {
          title: 'Реферальный баланс',
          dataIndex: 'referralBalance',
          render: (text, row) => {
            return text
          },
        }, {
          title: 'В холде',
          dataIndex: '',
          render: (text, row) => {
            return row.referralStat && row.referralStat.hold || null
          },
        }, {
          render: (text, row) => (
            <div className="table__actions">
              <span><Link to={`/stats?group=action_day&q[webmaster_id][equal]=${row.id}`} className="ant-btn">Статистика пользователя</Link></span>
              <span><Login user_id={row.id} /></span>
            </div>
          )
        }
      ]
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.users')
    this.fetch()
    window.addEventListener(`users.fetch`, this.fetch)

    api.get(`/v1/users/statuses`)
    .then(response => this.setState({ statuses: response.data }))
    api.get(Manager.data.personalManager.apiUrl)
    .then(response => {
      this.setState({ personalManagers: response.data })
    })
  }

  componentWillUnmount = () => {
    window.removeEventListener(`users.fetch`, this.fetch)
  }

  fetch = () => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/users', {
      params: {
        sort: pagination.sort || '-id',
        page: pagination.current || 1,
        'per-page': pagination.pageSize,
        ...filters,
      }
    })
    .then(responseUsers => {
      const { pagination } = this.state
      const total = parseInt(responseUsers.headers['x-pagination-total-count'])
      this.setState({
        users: responseUsers.data,
        pagination: {...pagination, total }
      })
      const userIds = responseUsers.data.map(user => user.id)
      return api.get('/v1/user-data', {
        params: {
          fields: 'user_id',
          expand: 'referralStat,referralBalance,personalManager',
          'q[user_id][in]': userIds.join(','),
          'per-page': pagination.pageSize,
        }
      })
    })
    .then(responseUsersData => {
      const { users } = this.state
      const usersData = responseUsersData.data
      if (users.length !== usersData.length) {
        console.log(`Внимание! Не для каждого id нашлась пара, проверьте получаемые данные.`)
      }
      const data = users.map(user => {
        const userData = usersData.find(el => {
          return user.id == el.user_id
        })
        if (!userData) {
          console.log(`Нет совпадений поля id для пользователя #${user.id}`)
        }
        const newUserData = {
          ...user,
          referralBalance: userData ? userData.referralBalance : null,
          referralStat: userData ? userData.referralStat : null,
          personalManager: userData ? userData.personalManager : null,
        }
        return newUserData
      })
      this.setState({
        isLoading: false,
        data,
      })
    })
    Filters.toUrl(filters)
  }

  handleTableChange = ({ current: page }, filters, { columnKey, order }) => {
    const sort = (order && columnKey) && (order == 'ascend' ? columnKey : `-${columnKey}`)
    const pagination = { ...this.state.pagination, current: page, sort: sort }
    this.setState({ pagination }, this.fetch)
  }

  onFilter = (values) => {
    const filters = Filters.prepare(values, { login: 'like', email: 'like' })
    this.setState({ filters }, this.fetch)
  }

  render() {
    const { statuses, isLoading, pagination } = this.state
    const props = pick(this.state, 'data:dataSource', 'columns', 'pagination', 'isLoading:loading')
    return (
      <div>
        <Filter onSubmit={this.onFilter} statuses={statuses} />
        <Table
          className="app__table"
          rowKey={item => item.id}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange}
          {...props}
          />
      </div>
    )
  }
}

export default Users
