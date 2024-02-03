export const CONST_DATE_VIEILLE = 300,
      CONST_DATE_EXPIREE = 1800

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
