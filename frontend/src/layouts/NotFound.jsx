import React from 'react'
import { RiEmotionSadLine } from 'react-icons/ri'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function NotFound() {
    const {role, isAuthenticated} = useAuth()
  return (
    <div className="mx-auto max-w-7xl flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8 ">

                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <RiEmotionSadLine className="h-10 w-10 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 ">Page non Trouvé</h2>
                    <p className="text-gray-600 px-8 mb-6">Veuillez actualiser la page et trouver une bonne endroit à accéder</p>
        {isAuthenticated ? (
            role === "LOCATAIRE" ? (
                <Link to="/" className="btn btn-accent mt-8">
                    Retour à l’accueil
                </Link>
            ):(
                <Link to="/admin/" className="btn btn-accent mt-8">
                    Retour à l’accueil
                </Link>
            )
        ):(
            <Link to="/" className="btn btn-accent mt-8">
                Retour à l’accueil
            </Link>
        )}
                  
                </div>
            </div>
  )
}

export default NotFound