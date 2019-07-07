import React, { Component } from 'react';
import { Select, Spin } from 'antd';

import api from '../../../../common/Api';
import ApiClient from '../../../../infra/api/apiClient';

export default class PersonalManagerSelect extends Component {
  constructor(props) {
    super(props);

    this.state = {
      managers: [],
      loading: false,
      value: 0,
    };
    this.apiClient = new ApiClient({ transport: api });
  }

  componentDidMount() {
    this.fetchManagers();
  }

  async fetchManagers() {
    try {
      this.setState({ loading: true });
      const managers = await this.apiClient.getPersonalManagers();
      this.setState({ managers, loading: false });
    } catch (e) {
      this.setState({ managers: [], loading: false });
    }
  }

  handleChange = (value, t) => {
    this.setState({ value });
    this.props.onChange(value, t)
  };

  render() {
    const { managers, loading, value } = this.state;

    return (
      <Select
        showSearch
        notFoundContent={loading ? <Spin size="small"/> : null}
        filterOption={false}
        style={{ width: '100%' }}
        size="large"
        {...this.props}
        value={value}
        onChange={this.handleChange}
      >
        <Select.Option value={0}>Все</Select.Option>
        {managers.map(manager => (<Select.Option value={manager.id} key={manager.id}>{manager.name}</Select.Option>))}
      </Select>
    );
  }
}