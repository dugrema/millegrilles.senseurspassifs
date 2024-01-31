export function IconeConnecte(props) {
    const { value } = props
  
    if(value === false) {
      return (
        <i className="fa fa-wifi expire"></i>
      )
    }
    if(value === true) {
      return <i className="fa fa-wifi hausse"></i>
    }
    return ''
}
