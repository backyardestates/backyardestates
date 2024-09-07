import Bio from '@/components/Bio'
import Catchall from '@/components/Catchall'
import Footer from '@/components/Footer'
import Masthead from '@/components/Masthead'
import Nav from '@/components/Nav'
import OpenGraph from '@/components/OpenGraph'

export default function OurTeam() {
    return (
        <>
            <OpenGraph title={`Backyard Estates - Our team`} />
            <Nav />
            <Masthead
                title="Our team"
                explanation="Meet the people who make your ADU possible."
            />
            <main className="centered">
                <Bio
                    portrait="adam-stewart.png"
                    name="Adam Stewart"
                    title="CEO and Founder"
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
                    name="Thomas Gibson"
                    title="Head of Construction"
                >
                    Tom Wright is an experienced construction industry
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
                    portrait="mary-martin.png"
                    name="Mary Martin"
                    title="Office Manager"
                >
                    Mary Martin is a key employee at Backyard Estates, having
                    joined the company during its founding. With over five years
                    of experience in the industry, Mary brings a wealth of
                    knowledge to her role as an ADU specialist. She has become
                    an expert in all of the city ordinances and permits related
                    to ADUs, which has been invaluable to the company&rsquo;s
                    success. Mary has been instrumental in building the
                    organization that Backyard Estates is today. Her expertise
                    and guidance have helped the company navigate the
                    complexities of the ADU market and grow into a leader in the
                    industry. Her contributions have been vital to the
                    company&rsquo;s success. Her dedication to her craft, her
                    expert knowledge of ADUs and city ordinances, and her
                    commitment to excellence make her a valuable asset to the
                    company and a highly respected member of the industry.
                </Bio>
                <Catchall />
            </main>
            <Footer />
        </>
    )
}
