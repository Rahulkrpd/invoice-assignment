import React from 'react'
import { Link, useNavigate } from "react-router-dom"
import { useState } from 'react'
import "./Login.css"
import { auth } from '../../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const submitHandler = (e) => {
    e.preventDefault()

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user)

        localStorage.setItem('CompanyName', user.displayName)
        localStorage.setItem('photoURL', user.photoURL)

        navigate('/dashboard')

      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        console.log(errorCode, errorMessage)
      })

  }




  return (
    <div className="login-wrapper">
      <div className="login-container">

        <div className="login-boxes  login-left">

        </div>

        <div className="login-boxes login-right">
          <h2 className='login-heading'>Login</h2>
          <form onSubmit={submitHandler} >
            <input onChange={(e) => setEmail(e.target.value)} className='login-input' type="text" placeholder='Email' required />
            <input onChange={(e) => setPassword(e.target.value)} className='login-input' type="password" placeholder='Password' required />
            <button>Sumit</button>
          </form>

          <Link to={'/register'} className='link' >Create an Account</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
