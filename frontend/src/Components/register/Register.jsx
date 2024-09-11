import React, { useRef, useState } from 'react'
import "./Register.css"
import { Link, useNavigate } from "react-router-dom"
import { auth, storage, db } from '../../firebase'
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { doc, setDoc } from "firebase/firestore"




const Register = () => {
  const fileinputRef = useRef(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [file, setFile] = useState(null)
  const navigate = useNavigate()

  const submitHandler = (e) => {
    e.preventDefault();
    console.log(email, company, password)

    // Create user with email and password
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (newUser) => {
        console.log(newUser);

        if (file) {
          // Create a unique filename using company name + current timestamp
          const date = new Date().getTime();
          const storageRef = ref(storage, `${company}_${date}`);

          // Upload the file to Firebase Storage
          const uploadTask = uploadBytesResumable(storageRef, file);

          // Monitor the upload progress
          uploadTask.on('state_changed',
            (snapshot) => {
              // Optional: You can track upload progress here
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`Upload is ${progress}% done`);
            },
            (error) => {
              console.error("File upload error:", error);
            },
            async () => {
              // Get the uploaded file's URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);


              console.log(downloadURL)

              // Update the user's profile with the company logo (photoURL)
              await updateProfile(newUser.user, {
                displayName: company,
                photoURL: downloadURL
              });

              setDoc(doc(db, "users", newUser.user.uid), {
                uid: newUser.user.uid,
                displayName: company,
                email: email,
                photoURL: downloadURL
              })

              localStorage.setItem('CompanyName', newUser.user.displayName)
              localStorage.setItem('photoURL', newUser.user.photoURL)


              navigate('/dashboard')


              console.log("Profile updated with photoURL:", downloadURL);
            }
          );
        }
      })
      .catch(error => {
        console.error("Error during registration:", error);
      });
  }

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-boxes login-left">
          {/* Left Section Content */}
        </div>

        <div className="login-boxes login-right">
          <h2 className='login-heading'>Create An Account</h2>
          <form onSubmit={submitHandler}>
            <input onChange={(e) => setEmail(e.target.value)} className='login-input' type="text" placeholder='Email' required />
            <input onChange={(e) => setCompany(e.target.value)} className='login-input' type="text" placeholder='Company Name' required />

            <input onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} className='login-input' type="file" ref={fileinputRef} />

            <input className='login-input' type="button" placeholder='Company logo' value='Company logo' onClick={() => fileinputRef.current.click()} />

            <input onChange={(e) => setPassword(e.target.value)} className='login-input' type="password" placeholder='Password' required />
            <button type="submit">Submit</button>
          </form>

          <Link to={'/login'} className='link'>Login Account</Link>
        </div>
      </div>
    </div>
  )
}

export default Register
