import React from 'react'
import { Route } from 'react-router-dom'

import * as ROUTES from 'modules/constants/routes'
import Home from './Home'
import SignUpPage from './components/Signup'
import SignInPage from './components/Signin'
import ForgetPasswordPage from './components/ForgetPassword'
import GetStarted from './components/GetStarted'
import ContactAs from './components/ContactAs'
import ConfirmEmail from './components/ConfirmEmail'


const HomeRouter = () => (
    <Route
      path={ROUTES.HOME}
      render={() => (
            <>

                {/* {authorized()
                        && !email()
                        && <Redirect to={ROUTES.CONFIRM_EMAIL} />} */}

                <Route path={ROUTES.HOME} exact component={Home} />
                <Route path={ROUTES.SIGNUP} exact component={SignUpPage} />
                <Route path={ROUTES.SIGNIN} exact component={SignInPage} />
                <Route path={ROUTES.PASSWORD_FORGET} exact component={ForgetPasswordPage} />
                <Route path={ROUTES.GET_STARTED} exact component={GetStarted} />
                <Route path={ROUTES.CONTACTS_AS} exact component={ContactAs} />
                <Route path={ROUTES.CONFIRM_EMAIL} exact component={ConfirmEmail} />
            </>
        )}
    />

)


HomeRouter.propTypes = {
}

export default HomeRouter