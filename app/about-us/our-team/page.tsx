import type { Metadata } from 'next'

import Bio from '@/components/Bio'
import Catchall from '@/components/Catchall'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
// import OpenGraph from '@/components/OpenGraph'

export const metadata: Metadata = {
    title: 'Our team - Backyard Estates',
    description: 'Meet the people who make your ADU possible.',
}

export default function OurTeam() {
    return (
        <>
            {/* <OpenGraph title={`Backyard Estates - Our team`} /> */}
            <Nav />
            <Masthead
                title="Our team"
                explanation="Meet the people who make your ADU possible."
            />
            <main className="centered">
                <Bio
                    portrait="adam-stewart.png"
                    name="Adam Stewart"
                    title="President and Founder"
                >
                    Meet Adam Stewart, an experienced construction professional
                    based in Los Angeles County. Adam holds a Bachelor of
                    Science degree in Finance from Brigham Young University and
                    a Masters in Business Entrepreneurship from the University
                    of Utah, which has equipped him with the knowledge and
                    skills necessary to excel in the construction industry.
                    Adam&rsquo;s passion for entrepreneurship started at a young
                    age when he launched his first company in the residential
                    services space at just 14 years old. Over the years, he has
                    gained a wealth of experience in the construction industry,
                    working on various projects and honing his skills in areas
                    such as project management, budgeting, and quality control.
                    As the CEO of Backyard Estates, Adam brings his extensive
                    construction experience and expertise to the table. He is
                    known for his attention to detail, strong work ethic, and
                    ability to manage projects efficiently, ensuring that every
                    project is completed on time and within budget.
                </Bio>
                <Bio
                    portrait="tom-gibson.png"
                    name="Tom Gibson"
                    title="Director of Construction"
                >
                    Tom Gibson is an experienced construction industry
                    professional who has been working in the field for over 50
                    years. He attended Eastern New Mexico University and Pierce
                    College in California, where he studied construction and
                    electrical work. Tom has worked in various roles throughout
                    his career, including as an electrician and estimator at
                    Cal-Crest Electric, where he started his career. Later, Tom
                    led Walton Construction Inc. as it&rsquo;s President, a
                    family owned general contracting company that specializes in
                    mixed-use Multi-Family and Senior Housing developments,
                    collaborating with non-profit clients on new and
                    rehabilitation projects for family, senior and special needs
                    residents. He also founded Tom W. Gibson, Inc., where he
                    oversaw general and electrical construction projects.
                    Tom&rsquo;s expertise in the construction field makes him a
                    key component to all of Backyard Estate&rsquo;s projects.
                </Bio>
                <Bio
                    portrait="serge-mayer.png"
                    name="Serge Mayer"
                    title="Head Architect"
                >
                    Meet Serge Mayer, a licensed architect with a passion for
                    design and a unique background in civil engineering and
                    surveying. Born and raised in Claremont, California, Serge
                    discovered his love for architecture in high school and went
                    on to graduate with a professional Bachelor&rsquo;s degree
                    in Architecture from Cal Poly Pomona, where he ranked among
                    the top of his class, Magna Cum Laude. Serge honed his
                    skills under the tutelage of Steven Phillips Architect of
                    Laguna Hills, working on some of the most extravagant
                    private homes in Southern California. Serge is well-versed
                    in various architectural styles, but his true passion lies
                    in designing Craftsman-style homes. His extensive civil
                    engineering and surveying experience make him particularly
                    valuable on projects involving difficult site conditions. He
                    is deeply committed to his community and is currently
                    serving on the Upland City Planning Commission. His passion
                    for design, dedication to sustainability, and well-rounded
                    background make him an invaluable member of our team here at
                    Backyard Estates.
                </Bio>
                <Bio
                    portrait="dusty-gravatt.png"
                    name="Dusty Gravatt"
                    title="Senior Construction Manager"
                >
                    With over 50 years of hands-on experience, Dusty is the
                    cornerstone of our construction operations. He&rsquo;s built
                    thousands of residential units throughout his career and
                    brings unmatched knowledge, precision, and leadership to
                    every ADU project. From foundation to final inspection,
                    Dusty ensures that each build meets the highest standards of
                    craftsmanship and care. His lifelong dedication to the trade
                    has helped countless homeowners turn their visions into
                    reality—creating spaces that reflect their needs, values,
                    and dreams. For Dusty, building ADUs isn&rsquo;t just about
                    construction—it&rsquo;s about building lasting impact for
                    families and communities.
                </Bio>
                <Bio
                    portrait="hector-tomas.png"
                    name="Hector Tomas"
                    title="Director of Finance"
                >
                    With over 15 years of experience in accounting and finance, Hector oversees all financial operations of the company—from accounts payable and receivable to budgeting, forecasting, and cash flow management. He ensures that every project is tracked for accurate costing and that company resources are managed efficiently to maintain healthy financial stability. Hector&rsquo;s strategic oversight helps the team make informed decisions that support growth and long-term sustainability.
                    He believes that ADUs represent the future of housing—offering flexibility and affordability at a time when traditional housing has become increasingly expensive. Through his work, Hector is proud to help families invest in smarter, more accessible housing solutions that build both financial and personal value.
                </Bio>
                <Bio
                    portrait="jose-cervantes.png"
                    name="Jose Cervantes"
                    title="Project Manager"
                >
                    Jose oversees the entire lifecycle of ADU projects—from
                    permitting and finish selections to construction management
                    and final closeout—ensuring each home is delivered with
                    quality, efficiency, and care for the homeowner&rsquo;s
                    vision. With over 12 years of experience in the construction
                    industry, he brings deep expertise across a variety of
                    project types, including multi-family and single-family
                    housing, mixed-use developments, and complex renovation
                    work. Jose has extensive experience navigating regulatory
                    compliance, including CASp inspections, ADA standards, and
                    Green Building requirements, and regularly coordinates with
                    agencies like Caltrans, Public Works, and SoCal Edison. His
                    well-rounded background in both public and private sector
                    projects enables him to deliver high-quality, code-compliant
                    ADUs that meet the highest standards. Jose believes in ADUs
                    as a way to keep families connected—offering independence,
                    comfort, and lasting value through thoughtful design and
                    construction.
                </Bio>
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
