import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message, Popover } from 'antd'
import moment from 'moment'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Helpers, { t, pick, TreeSelectRemote } from '../../common/Helpers'
import api from '../../common/Api'
import Consultant from '../Widgets/Consultant'

const TMP = JSON.parse('[{"id":3,"name":"Андорра","code":"AD"},{"id":4,"name":"ОАЭ","code":"AE"},{"id":5,"name":"Афганистан","code":"AF"},{"id":6,"name":"Антигуа и Барбуда","code":"AG"},{"id":7,"name":"Ангилья","code":"AI"},{"id":8,"name":"Албания","code":"AL"},{"id":9,"name":"Армения","code":"AM"},{"id":10,"name":"Кюрасао","code":"CW"},{"id":11,"name":"Ангола","code":"AO"},{"id":12,"name":"Антарктида","code":"AQ"},{"id":13,"name":"Аргентина","code":"AR"},{"id":14,"name":"Американское Самоа","code":"AS"},{"id":15,"name":"Австрия","code":"AT"},{"id":16,"name":"Австралия","code":"AU"},{"id":17,"name":"Аруба","code":"AW"},{"id":18,"name":"Азербайджан","code":"AZ"},{"id":19,"name":"Босния и Герцеговина","code":"BA"},{"id":20,"name":"Барбадос","code":"BB"},{"id":21,"name":"Бангладеш","code":"BD"},{"id":22,"name":"Бельгия","code":"BE"},{"id":23,"name":"Буркина Фасо","code":"BF"},{"id":24,"name":"Болгария","code":"BG"},{"id":25,"name":"Бахрейн","code":"BH"},{"id":26,"name":"Бурунди","code":"BI"},{"id":27,"name":"Бенин","code":"BJ"},{"id":28,"name":"Бермуды","code":"BM"},{"id":29,"name":"Бруней","code":"BN"},{"id":30,"name":"Боливия","code":"BO"},{"id":31,"name":"Бразилия","code":"BR"},{"id":32,"name":"Багамские острова","code":"BS"},{"id":33,"name":"Бутан","code":"BT"},{"id":35,"name":"Ботсвана","code":"BW"},{"id":36,"name":"Беларусь","code":"BY"},{"id":37,"name":"Белиз","code":"BZ"},{"id":38,"name":"Канада","code":"CA"},{"id":39,"name":"Кокосовые острова","code":"CC"},{"id":40,"name":"Демократическая Республика Конго","code":"CD"},{"id":41,"name":"Центрально-Африканская Республика","code":"CF"},{"id":42,"name":"Конго","code":"CG"},{"id":43,"name":"Швейцария","code":"CH"},{"id":44,"name":"Кот-д’Ивуар","code":"CI"},{"id":45,"name":"Острова Кука","code":"CK"},{"id":46,"name":"Чили","code":"CL"},{"id":47,"name":"Камерун","code":"CM"},{"id":48,"name":"Китай","code":"CN"},{"id":49,"name":"Колумбия","code":"CO"},{"id":50,"name":"Коста-Рика","code":"CR"},{"id":51,"name":"Куба","code":"CU"},{"id":52,"name":"Кабо-Верде","code":"CV"},{"id":53,"name":"Остров Рождества","code":"CX"},{"id":54,"name":"Кипр","code":"CY"},{"id":55,"name":"Чехия","code":"CZ"},{"id":56,"name":"Германия","code":"DE"},{"id":57,"name":"Джибути","code":"DJ"},{"id":58,"name":"Дания","code":"DK"},{"id":59,"name":"Доминика","code":"DM"},{"id":60,"name":"Доминиканская республика","code":"DO"},{"id":61,"name":"Алжир","code":"DZ"},{"id":62,"name":"Эквадор","code":"EC"},{"id":63,"name":"Эстония","code":"EE"},{"id":64,"name":"Египет","code":"EG"},{"id":66,"name":"Эритрея","code":"ER"},{"id":67,"name":"Испания","code":"ES"},{"id":68,"name":"Эфиопия","code":"ET"},{"id":69,"name":"Финляндия","code":"FI"},{"id":70,"name":"Фиджи","code":"FJ"},{"id":71,"name":"Фолклендские острова","code":"FK"},{"id":72,"name":"Микронезия","code":"FM"},{"id":73,"name":"Фарерские острова","code":"FO"},{"id":74,"name":"Франция","code":"FR"},{"id":75,"name":"Синт-Мартен","code":"SX"},{"id":76,"name":"Габон","code":"GA"},{"id":77,"name":"Великобритания","code":"GB"},{"id":78,"name":"Гренада","code":"GD"},{"id":79,"name":"Грузия","code":"GE"},{"id":80,"name":"Французская Гвинея","code":"GF"},{"id":81,"name":"Гана","code":"GH"},{"id":82,"name":"Гибралтар","code":"GI"},{"id":83,"name":"Гренландия","code":"GL"},{"id":84,"name":"Гамбия","code":"GM"},{"id":85,"name":"Гвинея","code":"GN"},{"id":86,"name":"Гваделупа","code":"GP"},{"id":87,"name":"Экваториальная Гвинея","code":"GQ"},{"id":88,"name":"Греция","code":"GR"},{"id":89,"name":"Южная Георгия и Южные Сандвичевы острова","code":"GS"},{"id":90,"name":"Гватемала","code":"GT"},{"id":91,"name":"Гуам","code":"GU"},{"id":92,"name":"Гвинея-Бисау","code":"GW"},{"id":93,"name":"Гайана","code":"GY"},{"id":94,"name":"Гонконг","code":"HK"},{"id":96,"name":"Гондурас","code":"HN"},{"id":97,"name":"Хорватия","code":"HR"},{"id":98,"name":"Гаити","code":"HT"},{"id":99,"name":"Венгрия","code":"HU"},{"id":100,"name":"Индонезия","code":"ID"},{"id":101,"name":"Ирландия","code":"IE"},{"id":102,"name":"Израиль","code":"IL"},{"id":103,"name":"Индия","code":"IN"},{"id":104,"name":"Британская территория в Индийском океане","code":"IO"},{"id":105,"name":"Ирак","code":"IQ"},{"id":106,"name":"Иран","code":"IR"},{"id":107,"name":"Исландия","code":"IS"},{"id":108,"name":"Италия","code":"IT"},{"id":109,"name":"Ямайка","code":"JM"},{"id":110,"name":"Иордания","code":"JO"},{"id":111,"name":"Япония","code":"JP"},{"id":112,"name":"Кения","code":"KE"},{"id":113,"name":"Кыргызстан","code":"KG"},{"id":114,"name":"Камбоджа","code":"KH"},{"id":115,"name":"Кирибати","code":"KI"},{"id":116,"name":"Коморские острова","code":"KM"},{"id":117,"name":"Сент-Китс и Невис","code":"KN"},{"id":118,"name":"Северная Корея","code":"KP"},{"id":119,"name":"Южная Корея","code":"KR"},{"id":120,"name":"Кувейт","code":"KW"},{"id":121,"name":"Каймановы острова","code":"KY"},{"id":122,"name":"Казахстан","code":"KZ"},{"id":123,"name":"Лаос","code":"LA"},{"id":124,"name":"Ливан","code":"LB"},{"id":125,"name":"Святая Люсия","code":"LC"},{"id":126,"name":"Лихтенштейн","code":"LI"},{"id":127,"name":"Шри-Ланка","code":"LK"},{"id":128,"name":"Либерия","code":"LR"},{"id":129,"name":"Лесото","code":"LS"},{"id":130,"name":"Литва","code":"LT"},{"id":131,"name":"Люксембург","code":"LU"},{"id":132,"name":"Латвия","code":"LV"},{"id":133,"name":"Ливия","code":"LY"},{"id":134,"name":"Марокко","code":"MA"},{"id":135,"name":"Монако","code":"MC"},{"id":136,"name":"Молдова","code":"MD"},{"id":137,"name":"Мадагаскар","code":"MG"},{"id":138,"name":"Маршалловы острова","code":"MH"},{"id":139,"name":"Македония","code":"MK"},{"id":140,"name":"Мали","code":"ML"},{"id":141,"name":"Мьянма","code":"MM"},{"id":142,"name":"Монголия","code":"MN"},{"id":143,"name":"Макао","code":"MO"},{"id":144,"name":"Северные Марианские острова","code":"MP"},{"id":145,"name":"Мартиника","code":"MQ"},{"id":146,"name":"Мавритания","code":"MR"},{"id":147,"name":"Монтсеррат","code":"MS"},{"id":148,"name":"Мальта","code":"MT"},{"id":149,"name":"Маврикий","code":"MU"},{"id":150,"name":"Мальдивские острова","code":"MV"},{"id":151,"name":"Малави","code":"MW"},{"id":152,"name":"Мексика","code":"MX"},{"id":153,"name":"Малайзия","code":"MY"},{"id":154,"name":"Мозамбик","code":"MZ"},{"id":155,"name":"Намибия","code":"NA"},{"id":156,"name":"Новая Каледония","code":"NC"},{"id":157,"name":"Нигер","code":"NE"},{"id":158,"name":"Норфолк","code":"NF"},{"id":159,"name":"Нигерия","code":"NG"},{"id":160,"name":"Никарагуа","code":"NI"},{"id":161,"name":"Нидерланды","code":"NL"},{"id":162,"name":"Норвегия","code":"NO"},{"id":163,"name":"Непал","code":"NP"},{"id":164,"name":"Науру","code":"NR"},{"id":165,"name":"Ниуэ","code":"NU"},{"id":166,"name":"Новая Зеландия","code":"NZ"},{"id":167,"name":"Оман","code":"OM"},{"id":168,"name":"Панама","code":"PA"},{"id":169,"name":"Перу","code":"PE"},{"id":170,"name":"Французская Полинезия","code":"PF"},{"id":171,"name":"Папуа Новая Гвинея","code":"PG"},{"id":172,"name":"Филиппины","code":"PH"},{"id":173,"name":"Пакистан","code":"PK"},{"id":174,"name":"Польша","code":"PL"},{"id":175,"name":"Сен-Пьер и Микелон","code":"PM"},{"id":176,"name":"Питкэрн","code":"PN"},{"id":177,"name":"Пуэрто-Рико","code":"PR"},{"id":178,"name":"Палестина","code":"PS"},{"id":179,"name":"Португалия","code":"PT"},{"id":180,"name":"Палау","code":"PW"},{"id":181,"name":"Парагвай","code":"PY"},{"id":182,"name":"Катар","code":"QA"},{"id":183,"name":"Реюньон","code":"RE"},{"id":184,"name":"Румыния","code":"RO"},{"id":185,"name":"Россия","code":"RU"},{"id":186,"name":"Руанда","code":"RW"},{"id":187,"name":"Саудовская Аравия","code":"SA"},{"id":188,"name":"Соломоновы острова","code":"SB"},{"id":189,"name":"Сейшеллы","code":"SC"},{"id":190,"name":"Судан","code":"SD"},{"id":191,"name":"Швеция","code":"SE"},{"id":192,"name":"Сингапур","code":"SG"},{"id":193,"name":"Остров Святой Елены","code":"SH"},{"id":194,"name":"Словения","code":"SI"},{"id":195,"name":"Свальбард и Ян-Майен","code":"SJ"},{"id":196,"name":"Словакия","code":"SK"},{"id":197,"name":"Сьерра-Леоне","code":"SL"},{"id":198,"name":"Сан-Марино","code":"SM"},{"id":199,"name":"Сенегал","code":"SN"},{"id":200,"name":"Сомали","code":"SO"},{"id":201,"name":"Суринам","code":"SR"},{"id":202,"name":"Сан-Томе и Принсипи","code":"ST"},{"id":203,"name":"Сальвадор","code":"SV"},{"id":204,"name":"Сирия","code":"SY"},{"id":205,"name":"Свазиленд","code":"SZ"},{"id":206,"name":"Туркс и Кейкос","code":"TC"},{"id":207,"name":"Чад","code":"TD"},{"id":208,"name":"Французские Южные и Антарктические территории","code":"TF"},{"id":209,"name":"Того","code":"TG"},{"id":210,"name":"Таиланд","code":"TH"},{"id":211,"name":"Таджикистан","code":"TJ"},{"id":212,"name":"Токелау","code":"TK"},{"id":213,"name":"Туркменистан","code":"TM"},{"id":214,"name":"Тунис","code":"TN"},{"id":215,"name":"Тонга","code":"TO"},{"id":216,"name":"Восточный Тимор","code":"TL"},{"id":217,"name":"Турция","code":"TR"},{"id":218,"name":"Тринидад и Тобаго","code":"TT"},{"id":219,"name":"Тувалу","code":"TV"},{"id":220,"name":"Тайвань","code":"TW"},{"id":221,"name":"Танзания","code":"TZ"},{"id":222,"name":"Украина","code":"UA"},{"id":223,"name":"Уганда","code":"UG"},{"id":224,"name":"Внешние малые острова США","code":"UM"},{"id":225,"name":"США","code":"US"},{"id":226,"name":"Уругвай","code":"UY"},{"id":227,"name":"Узбекистан","code":"UZ"},{"id":228,"name":"Ватикан","code":"VA"},{"id":229,"name":"Сент-Винсент и Гренадины","code":"VC"},{"id":230,"name":"Венесуэла","code":"VE"},{"id":231,"name":"Британские Виргинские острова","code":"VG"},{"id":232,"name":"Виргинские Острова США","code":"VI"},{"id":233,"name":"Вьетнам","code":"VN"},{"id":234,"name":"Вануату","code":"VU"},{"id":235,"name":"Уоллис и Футуна","code":"WF"},{"id":236,"name":"Самоа","code":"WS"},{"id":237,"name":"Йемен","code":"YE"},{"id":238,"name":"Майотта","code":"YT"},{"id":239,"name":"Сербия","code":"RS"},{"id":240,"name":"ЮАР","code":"ZA"},{"id":241,"name":"Замбия","code":"ZM"},{"id":242,"name":"Черногория","code":"ME"},{"id":243,"name":"Зимбабве","code":"ZW"},{"id":245,"name":"Косово","code":"XK"},{"id":247,"name":"Аландские острова","code":"AX"},{"id":248,"name":"Гернси","code":"GG"},{"id":249,"name":"Остров Мэн","code":"IM"},{"id":250,"name":"Джерси","code":"JE"},{"id":251,"name":"Сен-Бартелеми","code":"BL"},{"id":252,"name":"Сен-Мартен","code":"MF"},{"id":253,"name":"Бонэйр, Синт-Эстатиус и Саба","code":"BQ"},{"id":254,"name":"Южный Судан","code":"SS"},{"id":255,"name":"Не определена","code":"NAN"}]')

class Countries extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isVisible: false,
      limit: 3,
    }
  }

  _toggle = () => this.setState({ isVisible: !this.state.isVisible })

  renderCountries = (tmp = [], limit = 0) => {
    const countries = TMP
    return tmp.map((_tmp, i) => {
      if(limit && i > limit - 1) return
      const country = countries.filter(_country => _country.id == _tmp.id)
      if(!country) return null
      return (
        <p key={i} className="flex"><img src={`/img/flags/${country[0].code.toLowerCase()}.svg`} />{country[0].name}</p>
      )
    })
  }


  render() {
    const { isVisible, limit } = this.state
    const { country_data } = this.props
    if(!country_data) return null
    if(country_data.type == 'list') {
      return (
        <div className="offers__table-countries">
          {this.renderCountries(country_data.countries, limit)}
          {country_data.countries && country_data.countries.length > limit && (
            <Popover
              content={(<div className="offers__table-countries">{this.renderCountries(country_data.countries)}</div>)}
              trigger="click"
              visible={isVisible}
              onVisibleChange={this._toggle}>
              <span className="link">...</span>
            </Popover>
          )}
        </div>
      )
    } else {
      return (
        <div className="offers__table-countries">
          {(() => {
            switch (country_data.type) {
              case 'all': return 'ALL GEO';
              case 'all_except_cis': return 'Все кроме СНГ';
              default: return 'CНГ';
            }
          })()}
          {country_data.except && (
            <div className="offers__table-countries-trought">
              {this.renderCountries(country_data.except)}
            </div>
          )}
        </div>
      )
    }
  }
}

class _Filter extends Component {

  constructor(props) {
    super(props)
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      Object.keys(values).forEach(key => (values[key] === undefined || !values[key]) && delete values[key])
      this.props.onSubmit(values)
    })
  }

  validator = (name, label, input) => {
    const { getFieldDecorator } = this.props.form
    const options = { }
    return (
      <Form.Item className={`filter__field-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  render() {
    return (
      <div className="filter filter__tickets">
        <Form onSubmit={this.handleSubmit}>
          {this.validator('name', t('field.name'), <Input size="large" /> )}
          {this.validator('country_id', t('field.targeting'), <TreeSelectRemote target="/v1/countries" /> )}
          {this.validator('category_id', t('field.category'), <TreeSelectRemote target="/v1/categories" /> )}
          {this.validator('visible', 'Видимый', <Select size="large"><Select.Option key="1" value="true">Да</Select.Option><Select.Option key="0" value="false">Нет</Select.Option></Select> )}
          {this.validator('only_revshare', 'Только ревшары', <Select size="large"><Select.Option key="1" value="true">Да</Select.Option><Select.Option key="0" value="false">Нет</Select.Option></Select> )}
          <Form.Item>
            <h4>&nbsp;</h4>
            <Button htmlType="submit" type="primary" size="large">{t('button.show')}</Button>
          </Form.Item>
          <Form.Item>
            <h4>&nbsp;</h4>
            <Link to={`/offers/new`} className="ant-btn ant-btn-lg">Создать оффер</Link>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = Form.create()(_Filter)

class Offers extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      filters: {},
      pagination: {
        hideOnSinglePage: true,
        pageSize: 100,
      },
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
          width: 60,
        }, {
          dataIndex: 'logo',
          render: text => <img src={text} />,
          width: 190,
        }, {
          title: 'Оффер',
          dataIndex: 'name',
          className:'nobreak',
          width: 220,
          render: (text, row) => <Link to={`/offers/${row.id}`}>{text}</Link>,
        }, {
          title: 'GEO',
          dataIndex: '',
          render: (text, row) => <Countries country_data={row.country_data} countries={row.countries} />,
        },
        {
          title: 'Условия (название/знач./знач.)',
          dataIndex: '',
          render: (text, row) => {
            const { actions } = text
            const getPlainActions = actions && Array.isArray(actions) && actions.length > 0 && actions.reduce((acc, item) => {
              let condition, name, price, commission, site_revshare_percent, revshare_percent, price_from, price_to
              name = item.name ? item.name : '-'
              const { fields, pay_type } = item.pay_conditions

              switch (pay_type) {
                case 'flex':
                  price_from = fields.price_from != null ? fields.price_from : '-'
                  price_to = fields.price_to != null ? fields.price_to : '-'
                  condition = (
                    <span>
                      {name} / Стоимость от&nbsp;
                      <span style={{ whiteSpace: 'nowrap' }} >
                        {price_from}$&nbsp;
                      </span>
                        / Стоимость до&nbsp;
                      <span style={{ whiteSpace: 'nowrap' }} >
                        {price_to}$&nbsp;
                      </span>
                    </span>
                  )
                  return actions.length === 1 ? condition : <div>{condition};<br/>{acc}</div>
                case 'fix':
                  price = fields.price != null ? fields.price : '-'
                  commission = fields.commission != null ? fields.commission : '-'
                  condition = <span>{name} / Стоимость <span style={{ whiteSpace: 'nowrap' }} >{price}$</span> / Комиссия <span style={{ whiteSpace: 'nowrap' }} >{commission}$</span></span>
                  return actions.length === 1 ? condition : <div>{condition};<br/>{acc}</div>
                case 'revshare':
                  site_revshare_percent = fields.site_revshare_percent != null ? fields.site_revshare_percent * 100 : '-'
                  revshare_percent = fields.revshare_percent != null ? fields.revshare_percent * 100 : '-'
                  condition = <span>{name} / Ревшара сайта: <span style={{ whiteSpace: 'nowrap' }} >{site_revshare_percent}%</span> / Ревшара вебмастера: <span style={{ whiteSpace: 'nowrap' }} >{revshare_percent}%</span></span>
                  return actions.length === 1 ? condition : <div>{condition};<br/>{acc}</div>
              }

            }, '')
            return getPlainActions;
          },
          width: 220,
        }, {
          title: 'CR',
          dataIndex: 'avg_cr',
          render: text => `${text}%`
        }, {
          title: 'EPC',
          dataIndex: 'avg_epc'
        }, {
          title: 'Приоритет',
          dataIndex: 'priority',
          sorter: true,
        }, {
          title: 'Категория',
          dataIndex: '',
          render: (text, row) => {
            const categories = row.categories.map(item => item.name)
            return categories.join(',')
          }
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
    Helpers.setTitle('menu.offers')
    this.fetch()

    /* api.get('/v1/withdrawals/statuses')
    .then(response => {
      this.setState({ statuses: response.data })
    }) */
  }

  fetch = (page = 1) => {
    const { filters } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/offers', {
      params: {
        sort: '-id',
        page: page,
        'per-page': 100,
        expand: 'countries,categories,actions',
        ...filters
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

  onFilter = (values) => {
    const filters = {}
    const keys = Object.keys(values)
    if(keys) {
      keys.forEach(key => {
        const val = values[key]
        switch (key) {
          case 'country_id':
          case 'category_id':
            filters[`q[${key}][in]`] = val.join(',')
            break;
          case 'name':
            filters[`q[${key}][like]`] = val
            break;
          default:
            filters[`q[${key}][equal]`] = val
        }
      })
    }
    this.setState({ filters: filters}, this.fetch)
  }

  /* renderTargeting = () => {
    const { showTargeting } = this.state
    const { countries } = this.state.data
    if(!countries) return <span>{t('emptyText')}</span>
    const btn = !showTargeting && countries.length > 2 && <a onClick={this._showTargeting}>{t('button.show_all')}</a>
    const items = countries.map((item, i) => {
      if(!showTargeting && i > 2) return null
      return (
        <p key={i} className="flex"><img src={`/img/flags/${item.code}.svg`} />{item.name}</p>
      )
    })
    return <div>{items}{btn}</div>
  } */

  render() {
    const { data, columns, pagination, statuses, isLoading } = this.state

    return (
      <div>
        <Filter onSubmit={this.onFilter} statuses={statuses} />
        <Table
          className="offers__table app__table"
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

export default Offers
