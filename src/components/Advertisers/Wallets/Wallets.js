import React, { Component } from 'react'
import { Table } from 'antd'
import Helpers, { t } from '../../../common/Helpers'
import api from '../../../common/Api'
import Add from './Add'

const walletsTemp = [
  {
    created_at: 1547563900,
    data: {number: "000-352526"},
    deleted_at: null,
    id: 1494,
    name: "epay",
    status: "active",
    updated_at: null,
    user_id: 6844,
    wallet_module_id: 1,
  },
  {
    created_at: 1547547825,
    data: {number: "Z867514815177"},
    deleted_at: null,
    id: 1475,
    name: "WMZ",
    status: "active",
    updated_at: null,
    user_id: 2292,
    wallet_module_id: 4,
  }
]

class Wallets extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      modules: [],
      pagination: {
        hideOnSinglePage: true,
      },
      columns: [
        {
          title: t('field.name'),
          dataIndex: 'name',
        }, {
          title: t('field.type'),
          dataIndex: 'wallet_module_id',
          render: text => this.state.modules[text] && this.state.modules[text].name,
        }, {
          title: t('field.number'),
          dataIndex: 'data.number',
        }, {
          title: 'Удаление',
          render: (text, row) => <span className="link" onClick={() => this._onDelete(row.id)}>Удалить</span>
        }
      ]
    }
  }

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination }
    pager.current = pagination.current;
    this.setState({ pagination: pager })
    this.fetch(pagination.current)
  }

  componentDidMount = () => {
    api.get('/v1/wallet-modules')
    .then(response => {
      const modules = {}
      console.log('wallet-modules resp before', response.data);
      response.data.forEach(item => modules[item.id] = item)
      // console.log('wallet-modules modules', modules);
      this.setState({ modules: modules })
    })

    this.fetch()
  }

  addWallet = () => {
    this.fetch()
  }

  fetch = (page = 1) => {
    // this.setState({ isLoading: true })
    // api.get('/v1/wallets', {
    //   params: {
    //     sort: '-id',
    //     page: page,
    //     expand: 'wallet,module',
    //   }
    // })
    // .then(response => {
    //   console.log('wallets response', response.data);
    //   this.setState({
    //     isLoading: false,
    //     data: walletsTemp,
    //     pagination: {
    //       ...this.state.pagination,
    //     }
    //   })
      // this.setState({
      //   isLoading: false,
      //   data: response.data,
      //   pagination: {
      //     ...this.state.pagination,
      //     total: parseInt(response.headers['x-pagination-total-count'])
      //   }
      // })
    // })
  }

  _onDelete = (id) => {
    // api.delete(`/v1/wallets/${id}`)
    // .then(response => {
    //   this.fetch()
    // })
    // .catch(Helpers.errorHandler)
  }

  render() {
    const { data, columns, pagination, statuses, isLoading, modules } = this.state
    return (
      <div className="row">
        <div className="col-md-4">
          <Add addWallet={this.addWallet} />
        </div>
        <div className="col-md-8">
          <Table
            className="app__table"
            columns={columns}
            rowKey={item => item.id}
            dataSource={data}
            pagination={pagination}
            loading={isLoading}
            locale={{ emptyText: Helpers.emptyText }}
            onChange={this.handleTableChange}
          />
        </div>
      </div>
    )
  }
}

export default Wallets
