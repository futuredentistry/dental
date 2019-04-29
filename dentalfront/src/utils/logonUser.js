
const logonUser = () => JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCAL_STORAGE))

export const UserAuthorized = () => logonUser()
export const UserEmailVerified = () => (logonUser() ? logonUser().emailVerified : false)
export const UserEmail = () => logonUser() && logonUser().email
export const UserUid = () => logonUser() && logonUser().uid
export const UserFirstName = () => (logonUser() && logonUser().firstName ? logonUser().firstName : 'user')
export const UserFamilyName = () => (logonUser() && logonUser().familyName ? logonUser().familyName : '')
