import React, { Component } from 'react'
import { Route, Redirect, Switch, NavLink } from 'react-router-dom'
import Helpers, { t, pick, Events } from '../../common/Helpers'
import api from '../../common/Api'
import Icons from '../../common/Icons'
import { connect } from 'react-redux'
import { Modal, Table, Popover } from 'antd'
import moment from 'moment'

import Aggregate from './Stats'
import Ecommerce from './Ecommerce'
import Gambling from './Gambling'

const routes = [
  {
    name: 'Агрегированная',
    path: '/stats',
    component: Aggregate,
    exact: true
  },
  {
    name: 'Товарка / e-commerce',
    path: '/stats/e-commerce',
    component: Ecommerce,
  },
  {
    name: 'Gambling / betting',
    path: '/stats/gambling',
    component: Gambling,
  },
]

class _Leads extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      isLoading: false,
      pagination: {
        hideOnSinglePage: true,
        total: 0,
      },
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
          defaultSortOrder: 'descend',
          sorter: true
        }, {
          title: 'Цель',
          dataIndex: 'action.name',
          render: (text, row) => text && (
            <div className="flex">
              <a href={`/offers/${row.action.offer_id}`} target="_blank" className="nowrap table__link-black">{Icons.share} {text}</a>
            </div>
          ) || '',
        }, {
          title: 'Поток',
          dataIndex: 'stream.name',
          render: (text, row) => text && (
            <div className="flex">
              <a href={`/tools/streams?q[name][like]=${text}`} target="_blank" className="nowrap table__link-black">{Icons.share} {text}</a>
            </div>
          ) || '',

        }, {
          title: 'Доход',
          dataIndex: 'income',
          render: (text, row) => {
            const currency = Helpers.renderCurrency(row.currency_id)
            return `${text} ${currency}`
          }
        }, {
          title: 'Окончание холда',
          dataIndex: 'end_hold_time',
          render: text => text && moment.unix(text).utcOffset(Helpers.time_offset()).format('DD.MM.YY HH:mm')
        }, {
          title: 'Sub ID',
          render: (text, row) => {
            const tmp = row.sub_id
            text = Object.keys(tmp).map(key => <div>{t(`field.${key}`)}: {tmp[key] || '-'}</div>)
            return (
              <Popover content={text}>
                <span className="leads__table-show">{Icons.eye} Посмотреть</span>
              </Popover>
            )
          }
        }
      ],
    }
  }

  _close = () => this.props.dispatch({ type: 'STATS_LEADS_CLOSE'})

  componentDidUpdate = (prevProps) => {
    if(this.props.stats.isVisible == true && prevProps.stats.isVisible == false) this.fetch(true)
  }



  fetch = (isNew) => {
    const { stats } = this.props
    const { pagination } = this.state
    const group = stats.filters.group

    const params = {
      ...stats.filters,
      type: stats.type,
      expand: 'stream,action',
      'q[currency_id][equal]': stats.currency_id,
      sort: pagination.sort || '-id',
      page: pagination.current || 1,
    }

    params[`q[${group}][equal]`] = stats.value

    // clear
    this.setState({ isLoading: true, data: [], pagination: { hideOnSinglePage: true, total: isNew ? 0 : pagination.total }  })

    api.get(`/v1/leads`, { params })
    .then(response => {
      pagination.total = parseInt(response.headers['x-pagination-total-count'])
      this.setState({
        isLoading: false,
        data: response.data,
        pagination
      })
    })
  }

  handleTableChange = ({ current: page }, filters, { columnKey, order }) => {
    const sort = (order && columnKey) && (order == 'ascend' ? columnKey : `-${columnKey}`)
    const pagination = { ...this.state.pagination, current: page, sort: sort }
    this.setState({ pagination }, this.fetch)
  }

  render() {
    const { isLoading, columns, data, pagination } = this.state
    const { isVisible } = this.props.stats
    return (
      <Modal
       visible={isVisible}
       onCancel={this._close}
       footer={false}
       width={900}>
         <h1>Детализация лидов</h1>
         <Table
           columns={columns}
           dataSource={data}
           pagination={pagination}
           loading={Helpers.spinner('table', isLoading)}
           rowKey={item => item.id}
           locale={{ emptyText: Helpers.emptyText }}
           onChange={this.handleTableChange}
           />
       </Modal>
    )
  }
}
const Leads = connect((state) => pick(state, 'stats'))(_Leads)


class Stats extends Component {

  componentDidMount = () => {
    Helpers.setTitle('menu.stats')
  }

  render() {
    return (
      <div>
        <Leads />
        <div className="link__group">
          {routes.map((route, i) => <NavLink to={route.path} key={i} exact={route.exact}>{t(route.name)}</NavLink> )}
        </div>
        <Switch>
          {routes.map((route, i) => <Route ref={route.component && route.component.name} key={i} {...route} />)}
        </Switch>
      </div>
    )
  }
}

export default Stats
