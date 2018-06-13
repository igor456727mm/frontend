import React, { Component } from 'react'
import { Select, Spin } from 'antd';
import debounce from 'lodash/debounce';
import api from '../Api'
const Option = Select.Option;

class UserRemoteSelect extends React.Component {

  constructor(props) {
    super(props)
    this.fetchUser = debounce(this.fetchUser, 800)
    this.state = {
      data: [],
      value: null,
      fetching: false,
    }
  }

  componentDidMount = () => {
    const { value: initialValue } = this.props
    if(initialValue) {
      api.get(`/v1/users/${initialValue}`)
      .then(response => {
        this.setState({
          value: { key: initialValue, label: response.data.login },
          data: [],
          fetching: false,
        })
      })
    }
  }

  fetchUser = (value) => {
    this.setState({ data: [], fetching: true })
    const { target } = this.props
    api.get(target, {
      params: {
        'per-page': 999,
        'q[login][like]': value,
        'fields': 'login,id',
      }
    })
    .then(response => {
      const data = response.data.map(item => {
        return {
          value: item.id,
          text: item.login,
        }
      })
      this.setState({ data: data, fetching: false });
    })
  }

  handleChange = (value, t) => {

    this.setState({
      value: value,
      data: [],
      fetching: false,
    })

    if(value === undefined) value = { key: undefined, label: null }
    this.props.onChange(value.key, t)


  }

  render() {
    const { fetching, data, value } = this.state;
    const { value: initialValue } = this.props
    const _value = value || initialValue


    return (
      <Select
        labelInValue
        showSearch
        placeholder="Поиск..."
        notFoundContent={fetching ? <Spin size="small" /> : null}
        filterOption={false}
        onSearch={this.fetchUser}
        style={{ width: '100%' }}
        size="large"
        showArrow={false}
        allowClear
        {...this.props}
        value={_value}
        onChange={this.handleChange}
      >
        {data.map(d => <Option key={d.value}>{d.text}</Option>)}
      </Select>
    );
  }
}
export default UserRemoteSelect
