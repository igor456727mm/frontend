import React, { Component } from 'react'
import { TreeSelect } from 'antd'

const { TreeNode } = TreeSelect

class ReviseStatus extends React.Component {

  render() {
    const { reviseStatuses } = this.props
    const renderStatuses = Object.keys(reviseStatuses).map(item => <TreeNode value={item} title={reviseStatuses[item]} key={item} />)
    return (
      <TreeSelect
      allowClear
      multiple
      {...this.props}
    >
    {renderStatuses}
    </TreeSelect>
    );
  }
}

export default ReviseStatus
