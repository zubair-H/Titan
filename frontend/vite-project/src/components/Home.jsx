import React from 'react'
import Navbar from './Navbar'
import Section1 from './Section1'
import Section2 from './Section2'
import Section3 from './Section3'
import Section4 from './Section4'

import CheckBackendButton from './CheckBackendButton'

export default function Home() {
    return (
        <div>
            <Navbar></Navbar>

            <Section1></Section1>
            <Section2></Section2>
            <Section3></Section3>
            <Section4></Section4>

            {/*
              <CheckBackendButton/>
            */}



        </div>
    )
}
