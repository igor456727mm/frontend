import React, { Component } from 'react'
import { Select, Spin } from 'antd';
import debounce from 'lodash/debounce';
import api from '../Api'
const Option = Select.Option;

class RemoteSelect extends React.Component {

  constructor(props) {
    super(props)
    this.fetchData = debounce(this.fetchData, 800)
    this.state = {
      data: [],
      value: null,
      fetching: false,
    }
  }

  // componentDidMount = () => {
  //   const { value: initialValue } = this.props
  //   if(initialValue) {
  //     api.get(`${this.getApiUrl()}${initialValue}`)
  //     .then(response => {
  //       this.setState({
  //         value: { key: initialValue, label: response.data.login },
  //         data: [],
  //         fetching: false,
  //       })
  //     })
  //   }
  // }

  getDataReq = (target) => {
    const data = {
      users: {
        apiUrl: `/v1/${target}/`,
        fields: ['id', 'login'],
      },
      streams: {
        apiUrl: `/v1/${target}/`,
        fields: ['id', 'name'],
      }
    }
    return data[target]
  }

  getReqParams = (value, data) => {
      const reqParams = {
        'per-page': 999,
        'fields': `${data.fields[0]},${data.fields[1]}`,
      }
      if(isNaN(value)) {
        reqParams[`q[${data.fields[1]}][like]`] = value
      } else {
        reqParams[`q[${data.fields[0]}][equal]`] = value
      }
      return reqParams
  }

  fetchData = (value) => {
    this.setState({ data: [], fetching: true })
    const { target } = this.props
    const dataReq = this.getDataReq(target)
    const reqParams = this.getReqParams(value, dataReq)
    api.get(dataReq.apiUrl, { params: reqParams })
    .then(response => {
      const data = response.data.map(item => {
        return {
          value: item[dataReq.fields[0]],
          text: item[dataReq.fields[1]],
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
        onSearch={this.fetchData}
        style={{ width: '100%' }}
        size="large"
        showArrow={false}
        allowClear
        {...this.props}
        value={_value}
        onChange={this.handleChange}
      >
        {data.map(d => <Option key={d.value}>#{d.value} {d.text}</Option>)}
      </Select>
    );
  }
}
export default RemoteSelect
