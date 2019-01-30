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
      pagination: {
        hideOnSinglePage: true,
      },
      columns: [
        {
          title: t('field.name'),
          dataIndex: 'name',
        }, {
          title: t('field.number'),
          dataIndex: 'data.number',
        }, {
          title: 'Удаление',
          render: (text, row) => <span className="link" onClick={() => this.onDelete(row.id)}>Удалить</span>
        }
      ]
    }
  }

  onDelete = id => {
    const { wallets, getWallets } = this.props
    console.log('delete wallet', id);
    api.delete(`/v1/finances/wallets/${id}`)
    .then(response => {
      console.log('response delete wallet', response);
      getWallets()
    })
    .catch(Helpers.errorHandler)
  }

  render() {
    const { data, columns, isLoading, pagination } = this.state
    const { wallets, updateWallets } = this.props
    return (
      <div className="row">
        <div className="col-md-4">
          <Add updateWallets={updateWallets} />
        </div>
        <div className="col-md-8">
          <Table
            className="app__table"
            columns={columns}
            rowKey={item => item.id}
            pagination={pagination}
            dataSource={wallets}
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
