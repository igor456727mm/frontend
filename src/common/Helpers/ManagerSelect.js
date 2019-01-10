import React, { Component } from 'react'
import { TreeSelect } from 'antd';
import api from '../Api'

const { TreeNode } = TreeSelect

export const data = {
  personalManager: {
    title: 'Персональный менеджер',
    field: 'personalManagerIds',
    apiUrl: '/v1/personal-managers',
  },
  advertiserManager: {
    title: 'Менеджер по рекламодателям',
    field: 'advertiserManagerIds',
    apiUrl: '/v1/advertiser-managers',
  },
}


export class Select extends React.Component {
  state = {
    managers: [],
  }

  componentDidMount = () => {
    const { managerType } = this.props
    api.get(data[managerType].apiUrl)
    .then(response => {
      this.setState({ managers: response.data })
    })
  }

  render() {
    const { managers } = this.state
    const { multiple } = this.props
    const renderManagers = managers.map(item => <TreeNode value={String(item.id)} title={item.name} key={item.id} />)
    return (
      <TreeSelect
      allowClear
      multiple={multiple}
      {...this.props}
    >
    {renderManagers}
    </TreeSelect>
    );
  }
}
