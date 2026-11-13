import { createContext, useContext, useState } from 'react';

const NavbarContext = createContext();

export const useNavbar = () => useContext(NavbarContext);

export const NavBarProvider = ({ children }) => {
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [typeEvent, setTypeEvent] = useState('Tous');

    const resetValue = () => {
        setDateDebut("")
        setDateFin("")
        setTypeEvent("")
    }
    const value = {
        dateDebut,
        dateFin,
        typeEvent,
        setDateDebut,
        setDateFin,
        setTypeEvent,
        resetValue
    };

    return (
        <NavbarContext.Provider value={value}>
            {children}
        </NavbarContext.Provider>
    );
}